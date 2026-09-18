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

function buildMessage(evaluation: CertificateEvaluation): string {
  const headline =
    evaluation.severity === 'unknown'
      ? 'The state of the server certificates could not be determined.'
      : 'The server certificates require attention.';

  const details = evaluation.findings
    .map(finding => `- ${finding.detail}`)
    .join('\n');

  const staleness = evaluation.oldestEvaluatedAt
    ? `\n\nThe manager evaluated this on ${evaluation.oldestEvaluatedAt}; it is refreshed periodically, so it may not reflect a certificate replaced since then.`
    : '';

  return `${headline}\n\n${details}${staleness}`;
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
