import {
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { version as appVersion } from '../../package.json';
import {
  serverAPIConnectionCompatibility,
  checkAppServerCompatibility,
} from './server-api';

describe('checkAppServerCompatibility', () => {
  it.each`
    appVersion | serverAPIVersion | isCompatible
    ${'5.0.0'} | ${'5.0.0'}       | ${true}
    ${'5.0.0'} | ${'5.0.1'}       | ${true}
    ${'5.0.0'} | ${'5.0.10'}      | ${true}
    ${'5.0.0'} | ${'5.0.100'}     | ${true}
    ${'5.0.0'} | ${'4.9.1'}       | ${false}
    ${'5.0.0'} | ${'4.9.10'}      | ${false}
    ${'5.0.0'} | ${'4.9.100'}     | ${false}
    ${'5.0.0'} | ${'4.0.1'}       | ${false}
    ${'5.0.0'} | ${'4.0.10'}      | ${false}
    ${'5.0.0'} | ${'4.0.100'}     | ${false}
    ${'5.0.0'} | ${'4.10.1'}      | ${false}
    ${'5.0.0'} | ${'4.10.10'}     | ${false}
    ${'5.0.0'} | ${'4.10.100'}    | ${false}
  `(
    `appVersion: $appVersion, serverAPIVersion: $serverAPIVersion, isCompatible: $isCompatible`,
    ({ appVersion, serverAPIVersion, isCompatible }) => {
      expect(checkAppServerCompatibility(appVersion, serverAPIVersion)).toBe(
        isCompatible,
      );
    },
  );
});

describe('serverAPIConnectionCompatibility', () => {
  it.each`
    apiHostID    | apiVersionResponse                     | isCompatible
    ${'server1'} | ${{ api_version: '6.0.0' }}            | ${true}
    ${'server2'} | ${{ api_version: '0.0.0' }}            | ${false}
    ${'server3'} | ${{ missing_api_version_field: null }} | ${false}
  `(
    `Check server API connection and compatibility for the server API hosts`,
    async ({ apiHostID, apiVersionResponse, isCompatible }) => {
      const loggerMock = jest.fn();

      await serverAPIConnectionCompatibility(
        {
          manageHosts: {
            get: () => hosts,
          },
          logger: {
            debug: loggerMock,
            info: loggerMock,
            warn: loggerMock,
            error: loggerMock,
          },
          serverAPIClient: {
            asInternalUser: {
              request: () => ({
                data: {
                  data: apiVersionResponse,
                },
              }),
            },
          },
        },
        apiHostID,
        appVersion,
      );
      expect(loggerMock).toHaveBeenCalledWith(
        `Checking the connection and compatibility with server API [${apiHostID}]`,
      );

      if (apiVersionResponse.api_version) {
        if (isCompatible === true) {
          expect(loggerMock).toHaveBeenCalledWith(
            `Server API [${apiHostID}] version [${apiVersionResponse.api_version}] is compatible with the ${PLUGIN_APP_NAME} version`,
          );
        } else if (isCompatible === false) {
          expect(loggerMock).toHaveBeenCalledWith(
            `Server API [${apiHostID}] version [${
              apiVersionResponse.api_version
            }] is not compatible with the ${PLUGIN_APP_NAME} version [${appVersion}]. Major and minor number must match at least. It is recommended the server API and ${PLUGIN_APP_NAME} version are equals. Read more about this error in our troubleshooting guide: ${webDocumentationLink(
              PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
            )}.`,
          );
        }
      } else {
        expect(loggerMock).toHaveBeenCalledWith(
          `Error checking the connection and compatibility with server API [${apiHostID}]: version is not found in the response of server API`,
        );
      }
    },
  );
});
