import { checkCCS } from '../lib/ccs-detector';
import type { InitializationTaskRunContext } from './types';

interface APIHost {
  id: string;
  url?: string;
}

export interface ServerAPICertificateVerificationServices {
  manageHosts: {
    get: (
      hostID?: string,
      options?: { excludePassword: boolean },
    ) => Promise<APIHost[] | APIHost>;
    resolveVerifyCa: (host: APIHost) => boolean | null;
  };
}

interface HostCertificateVerification {
  id: string;
  verifyCa: boolean | null;
  http: boolean;
}

const isHttp = (url?: string) => /^http:\/\//i.test(url ?? '');

function hostDetail({ id, http }: HostCertificateVerification): string {
  return http
    ? `- [${id}] uses HTTP, so the connection is not encrypted.`
    : `- [${id}] has no ca setting, so its certificate is not verified.`;
}

/** Builds the warning naming each host whose certificate is not verified. */
function buildCertificateVerificationMessage(
  unverified: HostCertificateVerification[],
): string {
  const details = unverified.map(hostDetail).join('\n');
  const actions = [
    'Set ca for each host in the dashboard configuration to the CA certificate that signed the server API certificate, then restart the dashboard.',
    ...(unverified.some(({ http }) => http)
      ? ['Use an https URL for the hosts on HTTP.']
      : []),
  ].join('\n');

  return `The dashboard connects to the server API without verifying its certificate.\n\n${details}\n\n${actions}`;
}

/** Warns when the dashboard connects to a server API host without verifying its certificate. */
export const initializationTaskCreatorServerAPICertificateVerification = ({
  taskName,
  services,
}: {
  taskName: string;
  services: ServerAPICertificateVerificationServices;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    ctx.logger.debug(
      'Starting check of the server API certificate verification',
    );

    try {
      const configured = await services.manageHosts.get(undefined, {
        excludePassword: true,
      });
      const hosts = Array.isArray(configured) ? configured : [configured];
      const isCCS = await checkCCS(
        ctx.context.services.core.opensearch.client.asInternalUser,
      ).catch(() => false);
      const results: HostCertificateVerification[] = (
        isCCS ? hosts : hosts.slice(0, 1)
      ).map(host => ({
        id: host.id,
        verifyCa: services.manageHosts.resolveVerifyCa(host),
        http: isHttp(host.url),
      }));
      const unverified = results.filter(
        ({ verifyCa, http }) => http || verifyCa !== true,
      );

      if (unverified.length === 0) {
        ctx.logger.debug(
          'The server API certificate of every host is verified',
        );

        return ctx.taskResult.ok(results);
      }

      const message = buildCertificateVerificationMessage(unverified);

      ctx.logger.warn(message);

      return ctx.taskResult.warning(message, results);
    } catch (error) {
      const message = `Error checking the server API certificate verification: ${
        error instanceof Error ? error.message : String(error)
      }`;

      ctx.logger.error(message);
      throw new Error(message, { cause: error });
    }
  },
});
