import { checkCCS, detectCCS, invalidateCCSCache } from './ccs-detector';

const makeClient = (remoteInfoBody: object) => ({
  transport: {
    request: jest.fn().mockResolvedValue({ body: remoteInfoBody }),
  },
});

const makeContext = (remoteInfoBody: object) =>
  ({
    core: {
      opensearch: {
        client: {
          asInternalUser: makeClient(remoteInfoBody),
        },
      },
    },
    wazuh: { logger: { error: jest.fn() } },
  }) as any;

beforeEach(() => {
  invalidateCCSCache();
});

describe('checkCCS', () => {
  it('returns false when /_remote/info is empty', async () => {
    expect(await checkCCS(makeClient({}))).toBe(false);
  });

  it('returns true when /_remote/info has remote clusters', async () => {
    expect(
      await checkCCS(makeClient({ 'cluster-a': { connected: true } })),
    ).toBe(true);
  });

  it('throws when the request fails', async () => {
    const client = {
      transport: {
        request: jest.fn().mockRejectedValue(new Error('unreachable')),
      },
    };
    await expect(checkCCS(client)).rejects.toThrow('unreachable');
  });
});

describe('detectCCS', () => {
  it('returns false when /_remote/info is empty', async () => {
    const context = makeContext({});
    expect(await detectCCS(context)).toBe(false);
  });

  it('returns true when /_remote/info has remote clusters', async () => {
    const context = makeContext({ 'cluster-a': { connected: true } });
    expect(await detectCCS(context)).toBe(true);
  });

  it('returns false when the request throws', async () => {
    const context = {
      core: {
        opensearch: {
          client: {
            asInternalUser: {
              transport: {
                request: jest.fn().mockRejectedValue(new Error('unreachable')),
              },
            },
          },
        },
      },
      wazuh: { logger: { error: jest.fn() } },
    } as any;
    expect(await detectCCS(context)).toBe(false);
  });

  it('caches the result within TTL', async () => {
    const requestFn = jest
      .fn()
      .mockResolvedValue({ body: { 'cluster-a': {} } });
    const context = {
      core: {
        opensearch: {
          client: { asInternalUser: { transport: { request: requestFn } } },
        },
      },
      wazuh: { logger: { error: jest.fn() } },
    } as any;

    await detectCCS(context);
    await detectCCS(context);

    expect(requestFn).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after cache is invalidated', async () => {
    const requestFn = jest
      .fn()
      .mockResolvedValue({ body: { 'cluster-a': {} } });
    const context = {
      core: {
        opensearch: {
          client: { asInternalUser: { transport: { request: requestFn } } },
        },
      },
      wazuh: { logger: { error: jest.fn() } },
    } as any;

    await detectCCS(context);
    invalidateCCSCache();
    await detectCCS(context);

    expect(requestFn).toHaveBeenCalledTimes(2);
  });
});
