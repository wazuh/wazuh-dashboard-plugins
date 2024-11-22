import {
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { version as appVersion } from '../../package.json';

export const initializationTaskCreatorServerAPIConnectionCompatibility = ({
  taskName,
}: {
  taskName: string;
}) => ({
  name: taskName,
  async run(ctx) {
    try {
      ctx.logger.debug(
        'Starting check server API connection and compatibility',
      );
      const results = await ServersAPIConnectionCompatibility(ctx);
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
});

async function ServersAPIConnectionCompatibility(ctx) {
  if (ctx.scope === 'user' && ctx.request?.query?.apiHostID) {
    const host = await ctx.manageHosts.get(ctx.request.query.apiHostID, {
      excludePassword: true,
    });

    ctx.logger.debug(`APP version [${appVersion}]`);

    return await ServerAPIConnectionCompatibility(ctx, host.id, appVersion);
  } else {
    const hosts = await ctx.manageHosts.get(undefined, {
      excludePassword: true,
    });

    ctx.logger.debug(`APP version [${appVersion}]`);

    return await Promise.all(
      hosts.map(async ({ id: apiHostID }: { id: string }) =>
        ServerAPIConnectionCompatibility(ctx, apiHostID, appVersion),
      ),
    );
  }
}

export async function ServerAPIConnectionCompatibility(
  ctx: any,
  apiHostID: string,
  appVersion: string,
) {
  let connection = null,
    compatibility = null,
    api_version = null;
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
    api_version = response?.data?.data?.api_version;
    if (!api_version) {
      throw new Error('version is not found in the response of server API');
    }
    ctx.logger.debug(`Server API version [${api_version}]`);
    if (!checkAppServerCompatibility(appVersion, api_version)) {
      compatibility = false;
      ctx.logger.warn(
        `Server API [${apiHostID}] version [${api_version}] is not compatible with the ${PLUGIN_APP_NAME} version [${appVersion}]. Major and minor number must match at least. It is recommended the server API and ${PLUGIN_APP_NAME} version are equals. Read more about this error in our troubleshooting guide: ${webDocumentationLink(
          PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
        )}.`,
      );
    } else {
      compatibility = true;
      ctx.logger.info(
        `Server API [${apiHostID}] version [${api_version}] is compatible with the ${PLUGIN_APP_NAME} version`,
      );
    }
  } catch (error) {
    ctx.logger.warn(
      `Error checking the connection and compatibility with server API [${apiHostID}]: ${error.message}`,
    );
  } finally {
    return { connection, compatibility, api_version, id: apiHostID };
  }
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
