import {
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { version as appVersion } from '../../package.json';
import { API_USER_STATUS_RUN_AS } from '../../../wazuh-core/common/api-user-status-run-as';
import type { InitializationTaskRunContext } from './types';

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
    apiVersion = null;

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
    ctx.logger.warn(
      `Error checking the connection and compatibility with server API [${apiHostID}]: ${error.message}`,
    );
  }

  return {
    connection,
    compatibility,
    api_version: apiVersion,
    id: apiHostID,
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

    return await Promise.all(
      hosts.map(async ({ id: apiHostID }: { id: string }) =>
        serverAPIConnectionCompatibility(ctx, services, apiHostID, appVersion),
      ),
    );
  }
}

export const initializationTaskCreatorServerAPIConnectionCompatibility = ({
  taskName,
  services,
}: {
  taskName: string;
  services: any;
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

      if (
        results?.some(
          ({ compatibility, connection }) => compatibility && connection,
        )
      ) {
        return results;
      }
      throw new Error(
        `No server API available to connect. Ensure at least a server API is reachable and compatible with the dashboard. Review the server API hosts configuration, ensure the service is up, is reachable and compatible with the dashboard.`,
      );
    } catch (error) {
      const message = `Error checking server API connection and compatibility: ${error.message}`;

      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});

export const initializationTaskCreatorServerAPIRunAs = ({
  taskName,
  services,
}: {
  taskName: string;
  services: any;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    try {
      ctx.logger.debug('Starting check server API allow_run_as');

      const hosts = await services.manageHosts.getEntries({
        excludePassword: true,
      });

      const results = hosts.map((host: {
        id: string;
        cluster_info?: { allow_run_as?: number };
      }) => ({
        id: host.id,
        allow_run_as: host.cluster_info?.allow_run_as ?? -1,
        enabled: false,
        error: null as string | null,
      }));

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

      results.forEach((result: {
        id: string;
        allow_run_as: number;
        enabled: boolean;
        error: string | null;
      }) => {
        result.enabled = result.allow_run_as === API_USER_STATUS_RUN_AS.ENABLED;
      });

      const disabledHosts = results.filter(
        (result: { allow_run_as: number }) =>
          [
            API_USER_STATUS_RUN_AS.HOST_DISABLED,
            API_USER_STATUS_RUN_AS.ALL_DISABLED,
            API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED,
          ].includes(result.allow_run_as),
      );
      const unableToCheckHosts = results.filter(
        (result: { allow_run_as: number }) =>
          result.allow_run_as === API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK,
      );

      if (disabledHosts.length > 0) {
        const disabledSummary = disabledHosts
          .map((result: { id: string; allow_run_as: number }) =>
            `${result.id} (${allowRunAsLabel(result.allow_run_as)})`,
          )
          .join(', ');

        ctx.logger.warn(
          `Server API hosts with run_as permission disabled: ${disabledSummary}`,
        );

        throw new Error(
          `Some server API hosts have run_as permission disabled: ${disabledSummary}`,
        );
      }

      const enabledHosts = results.filter(
        (result: { enabled: boolean }) => result.enabled,
      );

      if (enabledHosts.length > 0) {
        ctx.logger.debug(
          `Server API hosts with allow_run_as enabled: ${enabledHosts
            .map((result: { id: string }) => result.id)
            .join(', ')}`,
        );
        return results;
      }

      if (unableToCheckHosts.length > 0) {
        ctx.logger.warn(
          `Server API hosts where allow_run_as could not be checked: ${unableToCheckHosts
            .map((result: { id: string }) => result.id)
            .join(', ')}`,
        );
        return results;
      }

      throw new Error(
        'No server API hosts have allow_run_as enabled. Ensure at least one API user is allowed to use run_as.',
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const message = `Error checking server API allow_run_as: ${errorMessage}`;

      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});
