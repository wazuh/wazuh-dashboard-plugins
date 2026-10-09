import {
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { version as appVersion } from '../../package.json';
import type { InitializationTaskRunContext } from './types';
import { checkCCS } from '../lib/ccs-detector';
import { nextRunMessage, type RateLimitRerun } from './rate-limit-rerun';

const MESSAGES = {
  NO_SERVER_AVAILABLE_CCS:
    'No server API hosts available to connect. Ensure all configured hosts are reachable and compatible with the dashboard.',
  NO_SERVER_AVAILABLE:
    'No server API available to connect. Ensure the server API host is reachable and compatible with the dashboard.',
  RUN_AS_NOT_ENABLED_CCS: (summary: string) =>
    `The configured server API hosts have not enabled run_as, or the API user cannot use it: ${summary}. Ensure all configured API hosts allow run_as for the API user.`,
  RUN_AS_NOT_ENABLED: (summary: string) =>
    `The configured server API host has not enabled run_as, or the API user cannot use it: ${summary}. Ensure the configured API host allows run_as for the API user.`,
  RATE_LIMITED_CCS: (nextRun: string) =>
    `The server API hosts are rate limiting the requests of the dashboard (status code 429), so their connection and compatibility could not be checked. ${nextRun}`,
  RATE_LIMITED: (nextRun: string) =>
    `The server API is rate limiting the requests of the dashboard (status code 429), so its connection and compatibility could not be checked. ${nextRun}`,
  RUN_AS_RATE_LIMITED_CCS: (nextRun: string) =>
    `The server API hosts are rate limiting the requests of the dashboard (status code 429), so the run_as permission of the API user could not be checked. ${nextRun}`,
  RUN_AS_RATE_LIMITED: (nextRun: string) =>
    `The server API is rate limiting the requests of the dashboard (status code 429), so the run_as permission of the API user could not be checked. ${nextRun}`,
};

const RATE_LIMIT_STATUS_CODE = 429;

export function isRateLimitError(error: unknown): boolean {
  return (
    (error as { response?: { status?: number } } | null | undefined)?.response
      ?.status === RATE_LIMIT_STATUS_CODE
  );
}

export function checkAppServerCompatibility(
  appVersion: string,
  serverAPIVersion: string,
) {
  const api = /v?(?<major>\d+)\.(?<minor>\d+)\.(?<path>\d+)/.exec(
    serverAPIVersion,
  );
  const [appVersionMajor, appVersionMinor] = appVersion.split('.');

  return (
    api?.groups?.major === appVersionMajor &&
    api?.groups?.minor === appVersionMinor
  );
}

export async function serverAPIConnectionCompatibility(
  ctx: InitializationTaskRunContext,
  services: any,
  apiHostID: string,
  appVersion: string,
) {
  let connection = null,
    compatibility = null,
    apiVersion = null,
    rateLimited = false;

  try {
    ctx.logger.debug(
      `Checking the connection and compatibility with server API [${apiHostID}]`,
    );

    const response = await services.serverAPIClient.asInternalUser.request(
      'GET',
      '/',
      {},
      { apiHostID },
    );

    connection = true;
    apiVersion = response?.data?.data?.api_version;

    if (!apiVersion) {
      throw new Error('version is not found in the response of server API');
    }

    ctx.logger.debug(`Server API version [${apiVersion}]`);

    if (checkAppServerCompatibility(appVersion, apiVersion)) {
      compatibility = true;
      ctx.logger.info(
        `Server API [${apiHostID}] version [${apiVersion}] is compatible with the ${PLUGIN_APP_NAME} version`,
      );
    } else {
      compatibility = false;
      ctx.logger.warn(
        `Server API [${apiHostID}] version [${apiVersion}] is not compatible with the ${PLUGIN_APP_NAME} version [${appVersion}]. Major and minor number must match at least. It is recommended the server API and ${PLUGIN_APP_NAME} version are equals. Read more about this error in our troubleshooting guide: ${webDocumentationLink(
          PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
        )}.`,
      );
    }
  } catch (error) {
    rateLimited = isRateLimitError(error);
    ctx.logger.warn(
      `Error checking the connection and compatibility with server API [${apiHostID}]: ${error.message}`,
    );
  }

  return {
    connection,
    compatibility,
    api_version: apiVersion,
    id: apiHostID,
    ...(rateLimited && { rateLimited: true }),
  };
}

async function serversAPIConnectionCompatibility(
  ctx: InitializationTaskRunContext,
  services: any,
) {
  if (ctx.context.scope === 'user' && ctx.request?.query?.apiHostID) {
    const host = await services.manageHosts.get(ctx.request.query.apiHostID, {
      excludePassword: true,
    });

    ctx.logger.debug(`APP version [${appVersion}]`);

    return [
      await serverAPIConnectionCompatibility(
        ctx,
        services,
        host.id,
        appVersion,
      ),
    ];
  } else {
    const hosts = await services.manageHosts.get(undefined, {
      excludePassword: true,
    });

    ctx.logger.debug(`APP version [${appVersion}]`);

    if (!hosts?.length) {
      return [];
    }

    const isCCS = await checkCCS(
      ctx.context.services.core.opensearch.client.asInternalUser,
    ).catch(() => false);
    const hostsToCheck = isCCS ? hosts : [hosts[0]];

    return await Promise.all(
      hostsToCheck.map(async ({ id }: { id: string }) =>
        serverAPIConnectionCompatibility(ctx, services, id, appVersion),
      ),
    );
  }
}

export const initializationTaskCreatorServerAPIConnectionCompatibility = ({
  taskName,
  services,
  rateLimitRerun,
}: {
  taskName: string;
  services: any;
  rateLimitRerun?: RateLimitRerun;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    try {
      ctx.logger.debug(
        'Starting check server API connection and compatibility',
      );

      const results = await serversAPIConnectionCompatibility(ctx, services);

      ctx.logger.debug(
        'Start check server API connection and compatibility finished',
      );

      const hasAvailable = results?.some(
        ({ compatibility, connection }) => compatibility && connection,
      );

      if (hasAvailable) {
        rateLimitRerun?.clear(taskName);

        return ctx.taskResult.ok(results);
      }

      const isCCS = results?.length > 1;

      if (results?.length > 0 && results.every(result => result.rateLimited)) {
        const nextRun = nextRunMessage(
          rateLimitRerun?.schedule(taskName, ctx) === true,
        );
        const message = isCCS
          ? MESSAGES.RATE_LIMITED_CCS(nextRun)
          : MESSAGES.RATE_LIMITED(nextRun);

        ctx.logger.warn(message);

        return ctx.taskResult.warning(message, results);
      }

      throw new Error(
        isCCS ? MESSAGES.NO_SERVER_AVAILABLE_CCS : MESSAGES.NO_SERVER_AVAILABLE,
      );
    } catch (error) {
      rateLimitRerun?.clear(taskName);

      const message = `Error checking server API connection and compatibility: ${error.message}`;

      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});

export const initializationTaskCreatorServerAPIRunAs = ({
  taskName,
  services,
  rateLimitRerun,
}: {
  taskName: string;
  services: any;
  rateLimitRerun?: RateLimitRerun;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    try {
      ctx.logger.debug('Starting check server API allow_run_as');

      const hosts = await services.manageHosts.getEntries({
        excludePassword: true,
      });

      const API_USER_STATUS_RUN_AS = services.API_USER_STATUS_RUN_AS;

      const isCCS = await checkCCS(
        ctx.context.services.core.opensearch.client.asInternalUser,
      ).catch(() => false);
      const hostsToValidate = isCCS ? hosts : hosts.slice(0, 1);

      const results = hostsToValidate.map(
        (host: { id: string; allow_run_as?: number }) => ({
          id: host.id,
          allow_run_as:
            host?.allow_run_as ?? API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK,
          enabled: host?.allow_run_as === API_USER_STATUS_RUN_AS.ENABLED,
        }),
      );

      const allowRunAsLabel = (value: number) => {
        switch (value) {
          case API_USER_STATUS_RUN_AS.ENABLED:
            return 'Run as allowed for user and host';
          case API_USER_STATUS_RUN_AS.HOST_DISABLED:
            return 'Run as disabled in host';
          case API_USER_STATUS_RUN_AS.ALL_DISABLED:
            return 'Run as disabled in host and user';
          case API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED:
            return 'Run as not allowed for user';
          case API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK:
          default:
            return 'Unable to check user run as permission';
        }
      };

      const notEnabledHosts = results.filter(
        (result: { allow_run_as: number }) =>
          [
            API_USER_STATUS_RUN_AS.HOST_DISABLED,
            API_USER_STATUS_RUN_AS.ALL_DISABLED,
            API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED,
            API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK,
          ].includes(result.allow_run_as),
      );
      const unableToCheckHosts = results.filter(
        (result: { allow_run_as: number }) =>
          result.allow_run_as === API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK,
      );

      if (
        notEnabledHosts.length > 0 &&
        notEnabledHosts.every(
          (result: { id: string; allow_run_as: number }) =>
            result.allow_run_as === API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK &&
            services.manageHosts.isRateLimited?.(result.id) === true,
        )
      ) {
        const nextRun = nextRunMessage(
          rateLimitRerun?.schedule(taskName, ctx) === true,
        );
        const message = isCCS
          ? MESSAGES.RUN_AS_RATE_LIMITED_CCS(nextRun)
          : MESSAGES.RUN_AS_RATE_LIMITED(nextRun);

        ctx.logger.warn(message);

        return ctx.taskResult.warning(message, results);
      }

      if (notEnabledHosts.length > 0) {
        const notEnabledSummary = notEnabledHosts
          .map(
            (result: { id: string; allow_run_as: number }) =>
              `${result.id} (${allowRunAsLabel(result.allow_run_as)})`,
          )
          .join(', ');

        const message = isCCS
          ? MESSAGES.RUN_AS_NOT_ENABLED_CCS(notEnabledSummary)
          : MESSAGES.RUN_AS_NOT_ENABLED(notEnabledSummary);
        ctx.logger.warn(message);

        throw new Error(message);
      }

      if (unableToCheckHosts.length > 0) {
        ctx.logger.warn(
          `Server API host where allow_run_as could not be checked: ${unableToCheckHosts
            .map((result: { id: string }) => result.id)
            .join(', ')}`,
        );
      }

      const enabledHosts = results.filter(
        (result: { enabled: boolean }) => result.enabled,
      );

      ctx.logger.debug(
        `Server API host with run_as permission enabled: ${enabledHosts
          .map((result: { id: string }) => result.id)
          .join(', ')}`,
      );
      rateLimitRerun?.clear(taskName);

      return ctx.taskResult.ok(enabledHosts);
    } catch (error) {
      rateLimitRerun?.clear(taskName);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const message = `Error checking server API allow_run_as: ${errorMessage}`;

      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});
