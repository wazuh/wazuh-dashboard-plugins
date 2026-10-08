import type {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
} from 'src/core/server';
import { WazuhApiCtrl } from './wazuh-api';

const AGENT_WITH_FORMULA_OS_NAME = {
  id: '001',
  status: 'active',
  name: 'agent-1',
  ip: '172.16.0.2',
  group: ['default'],
  manager: 'wazuh-manager',
  dateAdd: '2026-01-01T00:00:00Z',
  version: 'Wazuh v5.0.0',
  lastKeepAlive: '2026-01-01T00:01:00Z',
  os: {
    arch: 'x86_64',
    build: '1',
    codename: 'jammy',
    major: '22',
    minor: '04',
    name: '=1+1',
    platform: 'ubuntu',
    uname: 'Linux',
    version: '22.04',
  },
};

const makeContext = (
  affectedItems: Record<string, unknown>[],
  uiSettings: Record<string, unknown>,
) => {
  const request = jest.fn().mockResolvedValue({
    data: {
      data: {
        /* eslint-disable camelcase -- Wazuh Server API response field names */
        total_affected_items: affectedItems.length,
        affected_items: affectedItems,
        /* eslint-enable camelcase */
      },
    },
  });

  return {
    context: {
      core: {
        uiSettings: {
          client: {
            get: jest.fn((key: string) => Promise.resolve(uiSettings[key])),
          },
        },
      },
      wazuh: {
        logger: { debug: jest.fn(), error: jest.fn() },
        api: { client: { asCurrentUser: { request } } },
      },
    } as unknown as RequestHandlerContext,
    request,
  };
};

const makeResponse = () => ({
  ok: jest.fn(payload => payload),
  badRequest: jest.fn(payload => payload),
});

const exportAgentsCsv = async (
  uiSettings: Record<string, unknown> = { 'reports.csv.maxRows': 10_000 },
  path = '/agents',
) => {
  const ctrl = new WazuhApiCtrl();
  const { context } = makeContext([AGENT_WITH_FORMULA_OS_NAME], uiSettings);
  const response = makeResponse();

  const result = await ctrl.csv(
    context,
    {
      body: { path, id: 'default', filters: [] },
    } as unknown as OpenSearchDashboardsRequest,
    response as unknown as OpenSearchDashboardsResponseFactory,
  );

  return { context, response, result };
};

const cellAt = (csv: string, title: string) => {
  const [header, row] = csv.split('\n');
  const index = header.split(',').indexOf(title);

  expect(index).toBeGreaterThanOrEqual(0);

  return row.split(',')[index];
};

describe('WazuhApiCtrl.csv', () => {
  beforeEach(() => jest.clearAllMocks());

  it('neutralizes a nested os.name reported as a formula', async () => {
    const { response } = await exportAgentsCsv();

    const { body } = response.ok.mock.calls[0][0];

    expect(cellAt(body, 'OS name')).toBe("'=1+1");
    expect(cellAt(body, 'Status')).toBe('active');
  });

  it('neutralizes without consulting any CSV escaping setting', async () => {
    const { context, response } = await exportAgentsCsv();

    const readKeys = (
      context.core.uiSettings.client.get as jest.Mock
    ).mock.calls.map(([key]: [string]) => key);

    expect(readKeys).not.toContain('csv.escapeFormulaValues');
    expect(cellAt(response.ok.mock.calls[0][0].body, 'OS name')).toBe("'=1+1");
  });

  it('responds with a Content-Disposition attachment filename', async () => {
    const { response } = await exportAgentsCsv();

    const { headers } = response.ok.mock.calls[0][0];

    expect(headers['Content-Type']).toBe('text/csv');
    expect(headers['Content-Disposition']).toBe(
      'attachment; filename="agents.csv"',
    );
  });

  // The filename is derived from the caller-supplied path, so it must not be
  // able to break out of the quoted value or start a new header.
  it.each`
    path                              | expected
    ${'/agents"; filename="evil.exe'} | ${'agents-filename-evil.exe'}
    ${'/agents\r\nSet-Cookie: a=b'}   | ${'agents-Set-Cookie-a-b'}
    ${'/agents/../../etc/passwd'}     | ${'agents-..-..-etc-passwd'}
  `(
    'neutralizes $path in the Content-Disposition filename',
    async ({ path, expected }) => {
      const { response } = await exportAgentsCsv(
        { 'reports.csv.maxRows': 10_000 },
        path as string,
      );

      const disposition = response.ok.mock.calls[0][0].headers[
        'Content-Disposition'
      ] as string;

      expect(disposition).toBe(`attachment; filename="${expected}.csv"`);

      const filename = disposition.match(/^attachment; filename="(.*)"$/)?.[1];

      // Only characters the sanitizer allows: deleting it would fail here.
      expect(filename).toMatch(/^[\w.-]+$/);
    },
  );

  // `params` is mutated in place across pagination calls, so a mock that only
  // resolves a value can't tell what it looked like at call time: snapshot it
  // synchronously instead.
  const makeSnapshottingContext = (
    affectedItems: Record<string, unknown>[],
    uiSettings: Record<string, unknown>,
  ) => {
    const paramsSnapshots: Record<string, unknown>[] = [];
    const request = jest.fn((...args: unknown[]) => {
      const options = args[2] as { params: Record<string, unknown> };

      paramsSnapshots.push({ ...options.params });

      return Promise.resolve({
        data: {
          data: {
            /* eslint-disable camelcase -- Wazuh Server API response field names */
            total_affected_items: affectedItems.length,
            affected_items: affectedItems,
            /* eslint-enable camelcase */
          },
        },
      });
    });

    return {
      context: {
        core: {
          uiSettings: {
            client: {
              get: jest.fn((key: string) => Promise.resolve(uiSettings[key])),
            },
          },
        },
        wazuh: {
          logger: { debug: jest.fn(), error: jest.fn() },
          api: { client: { asCurrentUser: { request } } },
        },
      } as unknown as RequestHandlerContext,
      paramsSnapshots,
    };
  };

  // A `limit` filter must never override the server-enforced page size:
  // doing so turns one request into thousands of Manager API calls.
  it('ignores a caller-supplied limit filter and keeps the page size at 500', async () => {
    const totalItems = 50;
    const affectedItems = Array.from({ length: totalItems }, (_, index) => ({
      ...AGENT_WITH_FORMULA_OS_NAME,
      id: `${index}`,
    }));
    const ctrl = new WazuhApiCtrl();
    const { context, paramsSnapshots } = makeSnapshottingContext(
      affectedItems,
      { 'reports.csv.maxRows': 10_000 },
    );
    const response = makeResponse();

    await ctrl.csv(
      context,
      {
        body: {
          path: '/agents',
          id: 'default',
          filters: [{ name: 'limit', value: 1 }],
        },
      } as unknown as OpenSearchDashboardsRequest,
      response as unknown as OpenSearchDashboardsResponseFactory,
    );

    expect(paramsSnapshots.length).toBeGreaterThan(0);
    expect(paramsSnapshots.every(params => params.limit === 500)).toBe(true);
  });

  it('ignores a caller-supplied offset filter on the first page request', async () => {
    const { context, paramsSnapshots } = makeSnapshottingContext(
      [AGENT_WITH_FORMULA_OS_NAME],
      { 'reports.csv.maxRows': 10_000 },
    );
    const ctrl = new WazuhApiCtrl();
    const response = makeResponse();

    await ctrl.csv(
      context,
      {
        body: {
          path: '/agents',
          id: 'default',
          filters: [{ name: 'offset', value: 999 }],
        },
      } as unknown as OpenSearchDashboardsRequest,
      response as unknown as OpenSearchDashboardsResponseFactory,
    );

    expect(paramsSnapshots[0].offset).toBeUndefined();
  });
});

describe('WazuhApiCtrl.checkStoredAPI', () => {
  const API_HOST = {
    id: 'default',
    url: 'https://server-api',
    port: 55000,
    username: 'wazuh-internal-client',
    // eslint-disable-next-line camelcase -- API host setting name
    run_as: false,
    key: '/etc/wazuh/key.pem',
    cert: '/etc/wazuh/cert.pem',
    ca: '/etc/wazuh/ca.pem',
  };

  const checkStoredAPI = async (getRegistryDataByHost: jest.Mock) => {
    const internalRequest = jest.fn();
    const context = {
      wazuh: {
        logger: { debug: jest.fn(), error: jest.fn() },
        api: { client: { asInternalUser: { request: internalRequest } } },
      },
      // eslint-disable-next-line camelcase -- OSD request context key
      wazuh_core: {
        manageHosts: {
          getEntries: jest.fn().mockResolvedValue([]),
          get: jest.fn().mockResolvedValue(API_HOST),
          getRegistryDataByHost,
        },
      },
    } as unknown as RequestHandlerContext;
    const response = makeResponse();

    await new WazuhApiCtrl().checkStoredAPI(
      context,
      { body: { id: 'default' } } as unknown as OpenSearchDashboardsRequest,
      response as unknown as OpenSearchDashboardsResponseFactory,
    );

    return { internalRequest, response };
  };

  it('gets the cluster info from the registry data only', async () => {
    const getRegistryDataByHost = jest
      .fn()
      .mockResolvedValue({ node: 'node01', cluster: 'wazuh' });

    const { internalRequest, response } = await checkStoredAPI(
      getRegistryDataByHost,
    );

    expect(getRegistryDataByHost).toHaveBeenCalledTimes(1);
    expect(internalRequest).not.toHaveBeenCalled();
    expect(response.ok.mock.calls[0][0].body.data.cluster_info).toEqual({
      node: 'node01',
      cluster: 'wazuh',
    });
  });

  it('returns only the host id and cluster info', async () => {
    const getRegistryDataByHost = jest
      .fn()
      .mockResolvedValue({ node: 'node01', cluster: 'wazuh' });

    const { response } = await checkStoredAPI(getRegistryDataByHost);

    expect(response.ok.mock.calls[0][0].body.data).toEqual({
      id: 'default',
      // eslint-disable-next-line camelcase -- response field name
      cluster_info: { node: 'node01', cluster: 'wazuh' },
    });
  });

  it('reports the API as down when the connection is refused', async () => {
    const getRegistryDataByHost = jest
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }),
      );

    const { response } = await checkStoredAPI(getRegistryDataByHost);

    expect(response.ok.mock.calls[0][0].body.data).toEqual({ apiIsDown: true });
  });
});
