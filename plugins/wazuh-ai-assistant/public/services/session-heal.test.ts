import {
  API_PATHS,
  MANAGER_SESSION_EXPIRED_COPY,
} from '../../common/constants';
import {
  SettingsAccess,
  ensureManagerSession,
  healManagerSession,
  resetManagerSessionStateForTesting,
  withManagerSessionRetry,
} from './session-heal';

const httpGet = jest.fn();
const httpPost = jest.fn();
const http = { get: httpGet, post: httpPost } as never;

function access(overrides: Partial<SettingsAccess> = {}): SettingsAccess {
  return {
    administrator: true,
    message: null,
    defaultApiHostId: 'default',
    apiKeyEncryptionEnabled: true,
    ...overrides,
  };
}

/** The exact broken-session shape GET /settings/access reports for a missing/expired wz-token. */
function brokenAccess(overrides: Partial<SettingsAccess> = {}): SettingsAccess {
  return access({
    administrator: false,
    message: `Your Wazuh Manager API ${MANAGER_SESSION_EXPIRED_COPY}. (No token provider)`,
    ...overrides,
  });
}

/** An OSD http rejection shaped like an admin-gated 403 carrying the session copy. */
function sessionExpiredError(): Error & { body: { message: string } } {
  return Object.assign(new Error('Forbidden'), {
    body: {
      message: `Your Wazuh Manager API ${MANAGER_SESSION_EXPIRED_COPY}. (Token is not valid)`,
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetManagerSessionStateForTesting();
});

describe('healManagerSession', () => {
  it('posts the main plugin login route and resolves true', async () => {
    httpPost.mockResolvedValue({});
    await expect(healManagerSession(http, 'host-1')).resolves.toBe(true);
    expect(httpPost).toHaveBeenCalledWith('/api/login', {
      body: JSON.stringify({ idHost: 'host-1' }),
    });
  });

  it('never throws: any rejection resolves false', async () => {
    httpPost.mockRejectedValue(new Error('route not found'));
    await expect(healManagerSession(http, 'host-1')).resolves.toBe(false);
  });
});

describe('ensureManagerSession', () => {
  it('returns the probe as-is (no heal) when the session is already healthy', async () => {
    const healthy = access();
    httpGet.mockResolvedValue(healthy);

    await expect(ensureManagerSession(http)).resolves.toBe(healthy);
    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(httpGet).toHaveBeenCalledWith(API_PATHS.SETTINGS_ACCESS);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('heals and re-probes on a token-shaped failure, returning the re-probe', async () => {
    const healed = access();
    httpGet.mockResolvedValueOnce(brokenAccess()).mockResolvedValueOnce(healed);
    httpPost.mockResolvedValue({});

    await expect(ensureManagerSession(http)).resolves.toBe(healed);
    expect(httpPost).toHaveBeenCalledWith('/api/login', {
      body: JSON.stringify({ idHost: 'default' }),
    });
    expect(httpGet).toHaveBeenCalledTimes(2);
  });

  it('does not heal when no host id is available', async () => {
    const broken = brokenAccess({ defaultApiHostId: null });
    httpGet.mockResolvedValue(broken);

    await expect(ensureManagerSession(http)).resolves.toBe(broken);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('does not heal a genuine non-administrator (different copy)', async () => {
    const nonAdmin = access({
      administrator: false,
      message:
        'Your Wazuh Manager API user does not have the administrator role.',
    });
    httpGet.mockResolvedValue(nonAdmin);

    await expect(ensureManagerSession(http)).resolves.toBe(nonAdmin);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('resolves null (never rejects) when the probe itself fails', async () => {
    httpGet.mockRejectedValue(new Error('network down'));
    await expect(ensureManagerSession(http)).resolves.toBeNull();
  });

  it('returns the original probe when the heal fails, without memoizing it', async () => {
    httpGet.mockResolvedValue(brokenAccess());
    httpPost.mockRejectedValue(new Error('main plugin absent'));

    await expect(ensureManagerSession(http)).resolves.toEqual(brokenAccess());
    expect(httpPost).toHaveBeenCalledTimes(1);
    // Not memoized: a later guarded call must retry the heal rather than reuse the failure.
    await ensureManagerSession(http, { maxAgeMs: 60_000 });
    expect(httpPost).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight execution between concurrent callers', async () => {
    let resolveProbe!: (value: SettingsAccess) => void;
    httpGet.mockReturnValue(
      new Promise(resolve => {
        resolveProbe = resolve;
      }),
    );

    const first = ensureManagerSession(http);
    const second = ensureManagerSession(http);
    resolveProbe(access());

    expect(await first).toBe(await second);
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('serves a recent result from the memo when maxAgeMs allows it', async () => {
    httpGet.mockResolvedValue(access());

    const fresh = await ensureManagerSession(http);
    const memoized = await ensureManagerSession(http, { maxAgeMs: 60_000 });
    expect(memoized).toBe(fresh);
    expect(httpGet).toHaveBeenCalledTimes(1);

    // Without maxAgeMs the memo is ignored and the probe runs again.
    await ensureManagerSession(http);
    expect(httpGet).toHaveBeenCalledTimes(2);
  });
});

describe('withManagerSessionRetry', () => {
  it('heals and replays exactly once on a session-expired rejection', async () => {
    httpGet
      .mockResolvedValueOnce(brokenAccess())
      .mockResolvedValueOnce(access());
    httpPost.mockResolvedValue({});
    const fn = jest
      .fn()
      .mockRejectedValueOnce(sessionExpiredError())
      .mockResolvedValueOnce('saved');

    await expect(withManagerSessionRetry(http, fn)).resolves.toBe('saved');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(httpPost).toHaveBeenCalledWith('/api/login', expect.anything());
  });

  it('rethrows unrelated errors without healing or retrying', async () => {
    const unrelated = Object.assign(new Error('boom'), {
      body: { message: 'Internal server error' },
    });
    const fn = jest.fn().mockRejectedValue(unrelated);

    await expect(withManagerSessionRetry(http, fn)).rejects.toBe(unrelated);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('propagates the second rejection — never more than one replay', async () => {
    httpGet.mockResolvedValue(brokenAccess());
    httpPost.mockResolvedValue({});
    const fn = jest.fn().mockRejectedValue(sessionExpiredError());

    await expect(withManagerSessionRetry(http, fn)).rejects.toMatchObject({
      body: { message: expect.stringContaining(MANAGER_SESSION_EXPIRED_COPY) },
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
