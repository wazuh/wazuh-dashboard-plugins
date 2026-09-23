import {
  CERTIFICATE_EXPIRY_CRITICAL_SETTING,
  CERTIFICATE_EXPIRY_WARNING_SETTING,
} from '../../common/constants';
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
  configuration: {
    get: (settingKey: string) => Promise<unknown>;
  };
}

const SECONDS_PER_DAY = 24 * 60 * 60;

async function readDays(
  services: CertificateValidityServices,
  settingKey: string,
): Promise<number> {
  return (await services.configuration.get(settingKey)) as number;
}

async function readThresholds(
  services: CertificateValidityServices,
): Promise<{ warningSeconds: number; criticalSeconds: number }> {
  const warningDays = await readDays(
    services,
    CERTIFICATE_EXPIRY_WARNING_SETTING,
  );
  const criticalDays = await readDays(
    services,
    CERTIFICATE_EXPIRY_CRITICAL_SETTING,
  );

  return {
    warningSeconds: warningDays * SECONDS_PER_DAY,
    criticalSeconds: criticalDays * SECONDS_PER_DAY,
  };
}

/** Returns no outcome when the manager cannot list its nodes; the evaluator reports that as undetermined. */
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

function guidanceFor(
  finding: CertificateFinding,
  evaluation: CertificateEvaluation,
): string | null {
  if (finding.reason === 'expiring' || finding.reason === 'expired') {
    if (finding.scope !== 'listener') {
      return 'Ensure the CA certificate is replaced in the bundle with wazuh-manager-certs.';
    }

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

/** Maps an evaluator severity to a platform task result. */
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

    const thresholds = await readThresholds(services);
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
