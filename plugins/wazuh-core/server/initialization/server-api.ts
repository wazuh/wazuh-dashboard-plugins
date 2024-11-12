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
      await ServersAPIConnectionCompatibility(ctx);
      ctx.logger.info(
        'Start check server API connection and compatibility finished',
      );
    } catch (e) {
      const message = `Error checking server API connection and compatibility: ${e.message}`;
      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});

async function ServersAPIConnectionCompatibility(ctx) {
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

export async function ServerAPIConnectionCompatibility(
  ctx: any,
  apiHostID: string,
  appVersion: string,
) {
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
    const { api_version: serverAPIVersion } = response?.data?.data;
    if (!serverAPIVersion) {
      throw new Error('version is not found in the response of server API');
    }
    ctx.logger.debug(`Server API version [${serverAPIVersion}]`);
    if (!checkAppServerCompatibility(appVersion, serverAPIVersion)) {
      ctx.logger.warn(
        `Server API [${apiHostID}] version [${serverAPIVersion}] is not compatible with the ${PLUGIN_APP_NAME} version [${appVersion}]. Major and minor number must match at least. It is recommended the server API and ${PLUGIN_APP_NAME} version are equals. Read more about this error in our troubleshooting guide: ${webDocumentationLink(
          PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
        )}.`,
      );
      return;
    }
    ctx.logger.info(
      `Server API [${apiHostID}] version [${serverAPIVersion}] is compatible with the ${PLUGIN_APP_NAME} version`,
    );
  } catch (e) {
    ctx.logger.warn(
      `Error checking the connection and compatibility with server API [${apiHostID}]: ${e.message}`,
    );
  }
}

export function checkAppServerCompatibility(appVersion, serverAPIVersion) {
  const api = /v?(?<major>\d+)\.(?<minor>\d+)\.(?<path>\d+)/.exec(
    serverAPIVersion,
  );
  const [appVersionMajor, appVersionMinor] = appVersion.split('.');
  return (
    api?.groups?.major === appVersionMajor &&
    api?.groups?.minor === appVersionMinor
  );
}
