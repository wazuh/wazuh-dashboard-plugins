import {
  CERTIFICATE_EXPIRY_CRITICAL_DAYS,
  CERTIFICATE_EXPIRY_CRITICAL_SETTING,
  CERTIFICATE_EXPIRY_WARNING_DAYS,
  CERTIFICATE_EXPIRY_WARNING_SETTING,
} from '../../common/constants';
import { SavedObjectsClient } from '../../../../src/core/server';
import type { CertificateValidityOutcome } from '../../../wazuh-core/common/certificate-validity';
import { taskResult, type InitializationTaskRunContext } from './types';
import {
  CertificateEvaluation,
  CertificateFinding,
  evaluateCertificateValidity,
} from './certificate-validity-evaluator';

interface APIHostReference {
  id: string;
}

export interface CertificateValidityServices {
  manageHosts: {
    get: (
      hostID?: string,
      options?: { excludePassword: boolean },
    ) => Promise<APIHostReference[] | APIHostReference>;
  };
  certificateValidityClient: {
    getNodes: (apiHostID: string) => Promise<string[]>;
    getNodeTls: (
      apiHostID: string,
      node: string,
    ) => Promise<CertificateValidityOutcome>;
  };
}

const SECONDS_PER_DAY = 24 * 60 * 60;

/**
 * The settings live in the platform, not in the wazuh-core configuration store:
 * the store only carries the `opensearch_dashboards.yml` provider on the server.
 */
async function readDays(
  ctx: InitializationTaskRunContext,
  settingKey: string,
  fallback: number,
): Promise<number> {
  try {
    const core = ctx.context.services.core;
    const savedObjectsClient = new SavedObjectsClient(
      core.savedObjects.createInternalRepository(),
    );
    const value = await core.uiSettings
      .asScopedToClient(savedObjectsClient)
      .get(settingKey);

    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : fallback;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    ctx.logger.debug(
      `Could not read [${settingKey}], using [${fallback}]: ${message}`,
    );

    return fallback;
  }
}

/**
 * The settings are validated one at a time, so nothing stops a critical
 * threshold above the warning one. That pair would invert their meaning, so it
 * is refused in favour of the defaults.
 */
async function readThresholds(
  ctx: InitializationTaskRunContext,
): Promise<{ warningSeconds: number; criticalSeconds: number }> {
  const warningDays = await readDays(
    ctx,
    CERTIFICATE_EXPIRY_WARNING_SETTING,
    CERTIFICATE_EXPIRY_WARNING_DAYS,
  );
  const criticalDays = await readDays(
    ctx,
    CERTIFICATE_EXPIRY_CRITICAL_SETTING,
    CERTIFICATE_EXPIRY_CRITICAL_DAYS,
  );

  if (criticalDays >= warningDays) {
    ctx.logger.warn(
      `The certificate expiration error threshold [${criticalDays}] is not lower than the warning one [${warningDays}]. Using [${CERTIFICATE_EXPIRY_WARNING_DAYS}] and [${CERTIFICATE_EXPIRY_CRITICAL_DAYS}] day(s) instead.`,
    );

    return {
      warningSeconds: CERTIFICATE_EXPIRY_WARNING_DAYS * SECONDS_PER_DAY,
      criticalSeconds: CERTIFICATE_EXPIRY_CRITICAL_DAYS * SECONDS_PER_DAY,
    };
  }

  return {
    warningSeconds: warningDays * SECONDS_PER_DAY,
    criticalSeconds: criticalDays * SECONDS_PER_DAY,
  };
}

/** An empty list means the nodes could not be enumerated, not that all is well. */
async function collectOutcomes(
  ctx: InitializationTaskRunContext,
  services: CertificateValidityServices,
): Promise<CertificateValidityOutcome[]> {
  try {
    const hosts = await services.manageHosts.get(undefined, {
      excludePassword: true,
    });
    const [host] = Array.isArray(hosts) ? hosts : [hosts].filter(Boolean);
    const apiHostID = host?.id;

    if (!apiHostID) {
      ctx.logger.debug('No server API host configured');

      return [];
    }

    const nodes = await services.certificateValidityClient.getNodes(apiHostID);

    return await Promise.all(
      nodes.map(node =>
        services.certificateValidityClient.getNodeTls(apiHostID, node),
      ),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    ctx.logger.warn(
      `Could not list the manager nodes to check their certificates: ${message}`,
    );

    return [];
  }
}

/**
 * One line per problem, not per node: the action is the same on every node it
 * affects, so repeating it buries the findings it is meant to resolve.
 */
function guidanceFor(
  finding: CertificateFinding,
  evaluation: CertificateEvaluation,
): string | null {
  if (finding.reason === 'expiring' || finding.reason === 'expired') {
    if (finding.scope !== 'listener') {
      return 'Ensure the CA certificate is replaced in the bundle with wazuh-manager-certs.';
    }

    // remoted serves the certificate it loaded until it restarts.
    const loaded = evaluation.oldestListenerLoadedAt
      ? ` The manager has served the one it loaded on ${evaluation.oldestListenerLoadedAt} since then, so replacing the file alone does not clear this.`
      : '';

    return `Ensure the listener certificate is replaced and remoted restarted.${loaded}`;
  }

  switch (finding.reason) {
    case 'ca-mismatch': {
      return 'Ensure the bundle carries a CA that chains to the certificate the listener serves.';
    }

    case 'chain-invalid': {
      return 'Ensure the bundle validates the served certificate on its own, dates and constraints included.';
    }

    case 'bundle-unreadable': {
      return 'Ensure the bundle file exists and the manager can read it.';
    }

    case 'undetermined': {
      return 'Ensure every manager node is reachable and exposes the certificate validity resource.';
    }

    default: {
      return null;
    }
  }
}

function buildMessage(evaluation: CertificateEvaluation): string {
  const headline =
    evaluation.severity === 'unknown'
      ? 'The state of the server certificates could not be determined.'
      : 'The server certificates require attention.';

  const details = evaluation.findings
    .map(finding => `- ${finding.detail}`)
    .join('\n');

  const guidance = [
    ...new Set(
      evaluation.findings
        .map(finding => guidanceFor(finding, evaluation))
        .filter((line): line is string => line !== null),
    ),
  ];

  const actions = guidance.length > 0 ? `\n\n${guidance.join('\n')}` : '';

  return `${headline}\n\n${details}${actions}`;
}

/** The only place an internal severity meets the platform result model. */
function reportEvaluation(evaluation: CertificateEvaluation) {
  if (evaluation.severity === 'ok') {
    return taskResult.ok(evaluation);
  }

  const message = buildMessage(evaluation);

  return evaluation.severity === 'critical'
    ? taskResult.error(message, evaluation)
    : taskResult.warning(message, evaluation);
}

/** Reports the worst certificate state across the manager nodes. */
export const initializationTaskCreatorCertificateValidity = ({
  taskName,
  services,
}: {
  taskName: string;
  services: CertificateValidityServices;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    ctx.logger.debug('Starting check of the server certificates validity');

    const thresholds = await readThresholds(ctx);
    const outcomes = await collectOutcomes(ctx, services);
    const evaluation = evaluateCertificateValidity(outcomes, {
      now: Math.floor(Date.now() / 1000),
      ...thresholds,
    });

    const result = reportEvaluation(evaluation);

    if (result.status === 'ok') {
      ctx.logger.info(
        `The certificates of [${evaluation.nodesEvaluated}] manager node(s) are valid`,
      );
    } else if (result.status === 'error') {
      ctx.logger.error(result.message);
    } else {
      ctx.logger.warn(result.message);
    }

    return result;
  },
});
