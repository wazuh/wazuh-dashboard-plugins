/* eslint-disable camelcase -- the Wazuh Server API reports these fields in snake_case */
import {
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { version as appVersion } from '../../package.json';
import {
  serverAPIConnectionCompatibility,
  checkAppServerCompatibility,
  initializationTaskCreatorServerAPIConnectionCompatibility,
  initializationTaskCreatorServerAPIRunAs,
} from './server-api';
import type { InitializationTaskRunContext } from './types';
import {
  TASK_RESULT,
  withTaskResult,
} from '../mocks/health-check-task-context.mock';

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
    ${'server1'} | ${{ api_version: '5.0.0' }}            | ${true}
    ${'server2'} | ${{ api_version: '0.0.0' }}            | ${false}
    ${'server3'} | ${{ missing_api_version_field: null }} | ${false}
  `(
    `Check server API connection and compatibility for the server API hosts`,
    async ({ apiHostID, apiVersionResponse, isCompatible }) => {
      const loggerMock = jest.fn();

      await serverAPIConnectionCompatibility(
        {
          logger: {
            debug: loggerMock,
            info: loggerMock,
            warn: loggerMock,
            error: loggerMock,
          },
        },
        {
          manageHosts: {
            get: () => hosts,
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

// The manager reports allow_run_as with these values.
const RUN_AS = {
  UNABLE_TO_CHECK: -1,
  ALL_DISABLED: 0,
  USER_NOT_ALLOWED: 1,
  HOST_DISABLED: 2,
  ENABLED: 3,
};

const buildTaskContext = () =>
  withTaskResult({
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    context: {
      scope: 'internal',
      services: {
        core: {
          opensearch: {
            client: {
              asInternalUser: {
                transport: {
                  request: jest.fn().mockResolvedValue({ body: {} }),
                },
              },
            },
          },
        },
      },
    },
  }) as unknown as InitializationTaskRunContext;

describe('initializationTaskCreatorServerAPIConnectionCompatibility', () => {
  it('returns a branded result carrying the checked hosts', async () => {
    const services = {
      manageHosts: {
        get: jest.fn().mockResolvedValue([{ id: 'manager-local' }]),
      },
      serverAPIClient: {
        asInternalUser: {
          request: jest
            .fn()
            .mockResolvedValue({ data: { data: { api_version: appVersion } } }),
        },
      },
    };

    const result =
      (await initializationTaskCreatorServerAPIConnectionCompatibility({
        taskName: 'server-api:connection-compatibility',
        services,
      }).run(buildTaskContext())) as unknown as Record<PropertyKey, unknown>;

    expect(result[TASK_RESULT]).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.data).toEqual([
      {
        connection: true,
        compatibility: true,
        api_version: appVersion,
        id: 'manager-local',
      },
    ]);
  });
});

describe('initializationTaskCreatorServerAPIRunAs', () => {
  it('returns a branded result carrying the hosts that allow run_as', async () => {
    const services = {
      manageHosts: {
        getEntries: jest
          .fn()
          .mockResolvedValue([
            { id: 'manager-local', allow_run_as: RUN_AS.ENABLED },
          ]),
      },
      API_USER_STATUS_RUN_AS: RUN_AS,
    };

    const result = (await initializationTaskCreatorServerAPIRunAs({
      taskName: 'server-api:run-as',
      services,
    }).run(buildTaskContext())) as unknown as Record<PropertyKey, unknown>;

    expect(result[TASK_RESULT]).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.data).toEqual([
      { id: 'manager-local', allow_run_as: RUN_AS.ENABLED, enabled: true },
    ]);
  });
});

const RATE_LIMIT_TASK = 'server-api:check';
const tooManyRequests = Object.assign(new Error('Too Many Requests'), {
  response: { status: 429 },
});
const rateLimited = () => Promise.reject(tooManyRequests);
const unreachable = () => Promise.reject(new Error('connect ECONNREFUSED'));
const compatible = () =>
  Promise.resolve({ data: { data: { api_version: appVersion } } });

const buildRateLimitTask = (
  createTask: typeof initializationTaskCreatorServerAPIRunAs,
  services: Record<string, unknown>,
  hostCount: number,
  scheduled = true,
) => {
  const ctx = buildTaskContext();
  const rateLimitRerun = {
    schedule: jest.fn(() => scheduled),
    clear: jest.fn(),
    stop: jest.fn(),
  };

  if (hostCount > 1) {
    (
      ctx.context.services.core.opensearch.client.asInternalUser.transport
        .request as jest.Mock
    ).mockResolvedValue({ body: { remote: {} } });
  }

  const run = () =>
    createTask({ taskName: RATE_LIMIT_TASK, services, rateLimitRerun }).run(
      ctx,
    );

  return { ctx, rateLimitRerun, run };
};

const connectionTask = (
  requests: Record<string, () => Promise<unknown>>,
  scheduled?: boolean,
) =>
  buildRateLimitTask(
    initializationTaskCreatorServerAPIConnectionCompatibility,
    {
      manageHosts: {
        get: jest
          .fn()
          .mockResolvedValue(Object.keys(requests).map(id => ({ id }))),
      },
      serverAPIClient: {
        asInternalUser: {
          request: jest.fn(
            (_method: string, _path: string, _body: unknown, { apiHostID }) =>
              requests[apiHostID](),
          ),
        },
      },
    },
    Object.keys(requests).length,
    scheduled,
  );

const runAsTask = (
  entries: { id: string; allow_run_as: number }[],
  isRateLimited?: (id: string) => boolean,
) =>
  buildRateLimitTask(
    initializationTaskCreatorServerAPIRunAs,
    {
      manageHosts: {
        getEntries: jest.fn().mockResolvedValue(entries),
        ...(isRateLimited && { isRateLimited }),
      },
      API_USER_STATUS_RUN_AS: RUN_AS,
    },
    entries.length,
  );

describe('server API tasks when the server API rate limits the requests', () => {
  const UNABLE_TO_CHECK = { allow_run_as: RUN_AS.UNABLE_TO_CHECK };

  it.each([
    [
      'the connection check',
      () => connectionTask({ 'manager-local': rateLimited }),
      'The server API is rate limiting the requests of the dashboard (status code 429), so its connection and compatibility could not be checked. The check runs again in about a minute.',
    ],
    [
      'the connection check of several hosts',
      () =>
        connectionTask(
          { 'manager-1': rateLimited, 'manager-2': rateLimited },
          false,
        ),
      'The server API hosts are rate limiting the requests of the dashboard (status code 429), so their connection and compatibility could not be checked. The check runs again on the next scheduled run.',
    ],
    [
      'the run_as check',
      () =>
        runAsTask([{ id: 'manager-local', ...UNABLE_TO_CHECK }], () => true),
      'The server API is rate limiting the requests of the dashboard (status code 429), so the run_as permission of the API user could not be checked. The check runs again in about a minute.',
    ],
  ])(
    'returns a warning and schedules a re-run in %s',
    async (_task, buildTask, message) => {
      const { ctx, rateLimitRerun, run } = buildTask();

      await expect(run()).resolves.toMatchObject({
        status: 'warning',
        message,
      });
      expect(ctx.logger.warn).toHaveBeenCalledWith(message);
      expect(ctx.logger.error).not.toHaveBeenCalled();
      expect(rateLimitRerun.schedule).toHaveBeenCalledWith(
        RATE_LIMIT_TASK,
        ctx,
      );
    },
  );

  it.each([
    [
      'a rate limited host is mixed with an unreachable one',
      () =>
        connectionTask({ 'manager-1': rateLimited, 'manager-2': unreachable }),
      'No server API hosts available to connect.',
    ],
    [
      'run_as could not be checked for another reason',
      () =>
        runAsTask([{ id: 'manager-local', ...UNABLE_TO_CHECK }], () => false),
      'manager-local (Unable to check user run as permission)',
    ],
    [
      'another host does not have run_as enabled',
      () =>
        runAsTask(
          [
            { id: 'manager-1', ...UNABLE_TO_CHECK },
            { id: 'manager-2', allow_run_as: RUN_AS.HOST_DISABLED },
          ],
          () => true,
        ),
      'manager-1 (Unable to check user run as permission), manager-2 (Run as disabled in host)',
    ],
  ])('keeps throwing when %s', async (_description, buildTask, error) => {
    const { ctx, run } = buildTask();

    await expect(run()).rejects.toThrow(error);
    expect(ctx.logger.error).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'the connection check',
      () =>
        connectionTask({ 'manager-1': rateLimited, 'manager-2': compatible }),
    ],
    [
      'the run_as check',
      () => runAsTask([{ id: 'manager-local', allow_run_as: RUN_AS.ENABLED }]),
    ],
  ])('clears the re-run when %s passes', async (_task, buildTask) => {
    const { rateLimitRerun, run } = buildTask();

    await expect(run()).resolves.toMatchObject({ status: 'ok' });
    expect(rateLimitRerun.clear).toHaveBeenCalledWith(RATE_LIMIT_TASK);
  });
});
