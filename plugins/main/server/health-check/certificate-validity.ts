import {
  CERTIFICATE_EXPIRY_CRITICAL_SECONDS,
  CERTIFICATE_EXPIRY_WARNING_SECONDS,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import type { CertificateValidityOutcome } from '../../../wazuh-core/common/certificate-validity';
import type { InitializationTaskRunContext } from './types';
import {
  CertificateEvaluation,
  evaluateCertificateValidity,
} from './certificate-validity-evaluator';

/** No certificate renewal page is published yet. */
const DOCUMENTATION_PATH =
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING;

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

  const details = evaluation.findings.map(finding => finding.detail).join(' ');

  const staleness = evaluation.oldestEvaluatedAt
    ? ` The manager evaluated this on ${evaluation.oldestEvaluatedAt}; it is refreshed periodically, so it may not reflect a certificate replaced since then.`
    : '';

  return `${headline} ${details}${staleness} Read more in our troubleshooting guide: ${webDocumentationLink(
    DOCUMENTATION_PATH,
  )}.`;
}

/**
 * The only place an internal severity meets the platform result model: the task
 * is non-critical, so returning yields `green` and throwing yields `yellow`.
 */
function reportEvaluation(
  evaluation: CertificateEvaluation,
): CertificateEvaluation {
  if (evaluation.severity === 'ok') {
    return evaluation;
  }

  throw new Error(buildMessage(evaluation));
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

    const outcomes = await collectOutcomes(ctx, services);
    const evaluation = evaluateCertificateValidity(outcomes, {
      now: Math.floor(Date.now() / 1000),
      warningSeconds: CERTIFICATE_EXPIRY_WARNING_SECONDS,
      criticalSeconds: CERTIFICATE_EXPIRY_CRITICAL_SECONDS,
    });

    ctx.logger.debug(
      `Server certificates validity: [${evaluation.severity}] over [${evaluation.nodesEvaluated}] node(s)`,
    );

    return reportEvaluation(evaluation);
  },
});
