import {
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { version as appVersion } from '../../package.json';
import { InitializationTaskRunContext } from '../services';

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

    const response = await ctx.serverAPIClient.asInternalUser.request(
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
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return {
      connection,
      compatibility,
      api_version: apiVersion,
      id: apiHostID,
    };
  }
}

async function serversAPIConnectionCompatibility(
  ctx: InitializationTaskRunContext,
) {
  if (ctx.scope === 'user' && ctx.request?.query?.apiHostID) {
    const host = await ctx.manageHosts.get(ctx.request.query.apiHostID, {
      excludePassword: true,
    });

    ctx.logger.debug(`APP version [${appVersion}]`);

    return await serverAPIConnectionCompatibility(ctx, host.id, appVersion);
  } else {
    const hosts = await ctx.manageHosts.get(undefined, {
      excludePassword: true,
    });

    ctx.logger.debug(`APP version [${appVersion}]`);

    return await Promise.all(
      hosts.map(async ({ id: apiHostID }: { id: string }) =>
        serverAPIConnectionCompatibility(ctx, apiHostID, appVersion),
      ),
    );
  }
}

export const initializationTaskCreatorServerAPIConnectionCompatibility = ({
  taskName,
}: {
  taskName: string;
}) => {
  return {
    name: taskName,
    async run(ctx: InitializationTaskRunContext) {
      try {
        ctx.logger.debug(
          'Starting check server API connection and compatibility',
        );

        const results = await serversAPIConnectionCompatibility(ctx);

        ctx.logger.info(
          'Start check server API connection and compatibility finished',
        );

        return results;
      } catch (error) {
        const message = `Error checking server API connection and compatibility: ${error.message}`;

        ctx.logger.error(message);
        throw new Error(message);
      }
    },
  };
};
