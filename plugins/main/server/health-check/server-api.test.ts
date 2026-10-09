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

const rateLimitError = () =>
  Object.assign(
    new Error(
      'The server API [manager-local] is rate limiting the requests of the dashboard (status code 429)',
    ),
    { response: { status: 429 } },
  );

const rateLimitRerunMock = () => ({
  schedule: jest.fn(() => true),
  clear: jest.fn(),
  stop: jest.fn(),
});

describe('serverAPIConnectionCompatibility rate limiting', () => {
  const check = (error: Error) => {
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    return serverAPIConnectionCompatibility(
      { logger } as unknown as InitializationTaskRunContext,
      {
        serverAPIClient: {
          asInternalUser: { request: jest.fn().mockRejectedValue(error) },
        },
      },
      'manager-local',
      appVersion,
    );
  };

  it('flags the result when the server API rate limits the request', async () => {
    await expect(check(rateLimitError())).resolves.toEqual({
      connection: null,
      compatibility: null,
      api_version: null,
      id: 'manager-local',
      rateLimited: true,
    });
  });

  it('does not add the flag when the request fails for another reason', async () => {
    const result = await check(new Error('connect ECONNREFUSED'));

    expect(result).toEqual({
      connection: null,
      compatibility: null,
      api_version: null,
      id: 'manager-local',
    });
    expect(result).not.toHaveProperty('rateLimited');
  });
});

describe('initializationTaskCreatorServerAPIConnectionCompatibility rate limiting', () => {
  const runTask = (
    requests: Record<string, () => Promise<unknown>>,
    hosts = Object.keys(requests),
    rateLimitRerun?: ReturnType<typeof rateLimitRerunMock>,
  ) => {
    const ctx = buildTaskContext();
    // Several hosts are only checked with the cross cluster search
    if (hosts.length > 1) {
      (
        ctx.context.services.core.opensearch.client.asInternalUser.transport
          .request as jest.Mock
      ).mockResolvedValue({ body: { remote: {} } });
    }
    const services = {
      manageHosts: {
        get: jest.fn().mockResolvedValue(hosts.map(id => ({ id }))),
      },
      serverAPIClient: {
        asInternalUser: {
          request: jest.fn(
            (_method: string, _path: string, _body: unknown, { apiHostID }) =>
              requests[apiHostID](),
          ),
        },
      },
    };
    const run = () =>
      initializationTaskCreatorServerAPIConnectionCompatibility({
        taskName: 'server-api:connection-compatibility',
        services,
        rateLimitRerun,
      }).run(ctx);

    return { ctx, run };
  };
  const compatible = () =>
    Promise.resolve({ data: { data: { api_version: appVersion } } });
  const rateLimited = () => Promise.reject(rateLimitError());
  const unreachable = () => Promise.reject(new Error('connect ECONNREFUSED'));

  it('returns a warning result, without an error log, when the server API rate limits the request', async () => {
    const { ctx, run } = runTask({ 'manager-local': rateLimited });

    const result = (await run()) as unknown as Record<PropertyKey, unknown>;

    expect(result[TASK_RESULT]).toBe(true);
    expect(result.status).toBe('warning');
    expect(result.message).toBe(
      'The server API is rate limiting the requests of the dashboard (status code 429), so its connection and compatibility could not be checked. The check runs again on the next scheduled run.',
    );
    expect(result.data).toEqual([
      expect.objectContaining({ id: 'manager-local', rateLimited: true }),
    ]);
    expect(ctx.logger.warn).toHaveBeenCalledWith(result.message);
    expect(ctx.logger.error).not.toHaveBeenCalled();
  });

  it('keeps throwing when the only failure is not a rate limit', async () => {
    const { ctx, run } = runTask({ 'manager-local': unreachable });

    await expect(run()).rejects.toThrow(
      'Error checking server API connection and compatibility: No server API available to connect. Ensure the server API host is reachable and compatible with the dashboard.',
    );
    expect(ctx.logger.error).toHaveBeenCalledTimes(1);
  });

  it('keeps throwing when the rate limited host is mixed with another failure', async () => {
    const { ctx, run } = runTask({
      'manager-1': rateLimited,
      'manager-2': unreachable,
    });

    await expect(run()).rejects.toThrow(
      'No server API hosts available to connect.',
    );
    expect(ctx.logger.error).toHaveBeenCalledTimes(1);
  });

  it('returns the available hosts when another host is rate limited', async () => {
    const { run } = runTask({
      'manager-1': rateLimited,
      'manager-2': compatible,
    });

    const result = (await run()) as unknown as Record<PropertyKey, unknown>;

    expect(result.status).toBe('ok');
  });

  it('schedules a re-run when rate limited and clears it when available', async () => {
    const rateLimitRerun = rateLimitRerunMock();
    const { ctx, run } = runTask(
      { 'manager-local': rateLimited },
      undefined,
      rateLimitRerun,
    );

    const result = (await run()) as unknown as Record<PropertyKey, unknown>;

    expect(rateLimitRerun.schedule).toHaveBeenCalledWith(
      'server-api:connection-compatibility',
      ctx,
    );
    expect(result.message).toMatch(
      /could not be checked\. The check runs again in about a minute\.$/,
    );

    await runTask(
      { 'manager-local': compatible },
      undefined,
      rateLimitRerun,
    ).run();

    expect(rateLimitRerun.clear).toHaveBeenCalledWith(
      'server-api:connection-compatibility',
    );
  });

  it('returns a warning result when every host is rate limited', async () => {
    const { ctx, run } = runTask({
      'manager-1': rateLimited,
      'manager-2': rateLimited,
    });

    const result = (await run()) as unknown as Record<PropertyKey, unknown>;

    expect(result.status).toBe('warning');
    expect(result.message).toBe(
      'The server API hosts are rate limiting the requests of the dashboard (status code 429), so their connection and compatibility could not be checked. The check runs again on the next scheduled run.',
    );
    expect(ctx.logger.error).not.toHaveBeenCalled();
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

  describe('when the run_as permission could not be checked', () => {
    const runRunAs = (
      entries: { id: string; allow_run_as: number }[],
      isRateLimited?: (id: string) => boolean,
      rateLimitRerun?: ReturnType<typeof rateLimitRerunMock>,
    ) => {
      const ctx = buildTaskContext();
      // Several hosts are only checked with the cross cluster search
      if (entries.length > 1) {
        (
          ctx.context.services.core.opensearch.client.asInternalUser.transport
            .request as jest.Mock
        ).mockResolvedValue({ body: { remote: {} } });
      }
      const run = () =>
        initializationTaskCreatorServerAPIRunAs({
          taskName: 'server-api:run-as',
          services: {
            manageHosts: {
              getEntries: jest.fn().mockResolvedValue(entries),
              ...(isRateLimited ? { isRateLimited } : {}),
            },
            API_USER_STATUS_RUN_AS: RUN_AS,
          },
          rateLimitRerun,
        }).run(ctx);

      return { ctx, run };
    };

    it('returns a warning result, without an error log, when the server API rate limits the requests', async () => {
      const { ctx, run } = runRunAs(
        [{ id: 'manager-local', allow_run_as: RUN_AS.UNABLE_TO_CHECK }],
        id => id === 'manager-local',
      );

      const result = (await run()) as unknown as Record<PropertyKey, unknown>;

      expect(result[TASK_RESULT]).toBe(true);
      expect(result.status).toBe('warning');
      expect(result.message).toBe(
        'The server API is rate limiting the requests of the dashboard (status code 429), so the run_as permission of the API user could not be checked. The check runs again on the next scheduled run.',
      );
      expect(ctx.logger.warn).toHaveBeenCalledWith(result.message);
      expect(ctx.logger.error).not.toHaveBeenCalled();
    });

    it('schedules a re-run when rate limited and clears it when checked', async () => {
      const rateLimitRerun = rateLimitRerunMock();
      const { ctx, run } = runRunAs(
        [{ id: 'manager-local', allow_run_as: RUN_AS.UNABLE_TO_CHECK }],
        () => true,
        rateLimitRerun,
      );

      const result = (await run()) as unknown as Record<PropertyKey, unknown>;

      expect(rateLimitRerun.schedule).toHaveBeenCalledWith(
        'server-api:run-as',
        ctx,
      );
      expect(result.message).toMatch(
        /could not be checked\. The check runs again in about a minute\.$/,
      );

      await runRunAs(
        [{ id: 'manager-local', allow_run_as: RUN_AS.ENABLED }],
        undefined,
        rateLimitRerun,
      ).run();

      expect(rateLimitRerun.clear).toHaveBeenCalledWith('server-api:run-as');
    });

    it.each([
      ['it is not rate limited', () => false],
      ['the service does not report it', undefined],
    ])('keeps throwing when %s', async (_description, isRateLimited) => {
      const { ctx, run } = runRunAs(
        [{ id: 'manager-local', allow_run_as: RUN_AS.UNABLE_TO_CHECK }],
        isRateLimited,
      );

      await expect(run()).rejects.toThrow(
        'Error checking server API allow_run_as: The configured server API host has not enabled run_as, or the API user cannot use it: manager-local (Unable to check user run as permission). Ensure the configured API host allows run_as for the API user.',
      );
      expect(ctx.logger.error).toHaveBeenCalledTimes(1);
    });

    it('keeps throwing when another host does not have run_as enabled', async () => {
      const { run } = runRunAs(
        [
          { id: 'manager-1', allow_run_as: RUN_AS.UNABLE_TO_CHECK },
          { id: 'manager-2', allow_run_as: RUN_AS.HOST_DISABLED },
        ],
        () => true,
      );

      await expect(run()).rejects.toThrow(
        'manager-1 (Unable to check user run as permission), manager-2 (Run as disabled in host)',
      );
    });
  });
});
