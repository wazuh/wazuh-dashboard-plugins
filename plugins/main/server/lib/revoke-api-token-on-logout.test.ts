import { registerRevokeAPITokenOnLogout } from './revoke-api-token-on-logout';

const COOKIE = 'wz-token=abc; wz-api=default; security_authentication=xyz';
const EXPIRE_COOKIE = {
  headers: { 'set-cookie': 'wz-token=; Path=/; Max-Age=0; HttpOnly' },
};

function setup(requestImpl = jest.fn().mockResolvedValue({})) {
  let handler;
  const http = { registerOnPreResponse: jest.fn(fn => (handler = fn)) };
  const logger = { warn: jest.fn() };
  const asScoped = jest.fn(() => ({ request: requestImpl }));
  registerRevokeAPITokenOnLogout(http, {
    serverAPIClient: { asScoped },
    logger,
  });
  const toolkit = { next: jest.fn(headers => headers) };
  const run = (route: string, { cookie = COOKIE, statusCode = 200 } = {}) => {
    const [method, path] = route.split(' ');
    return handler(
      { route: { method, path }, headers: { cookie } },
      { statusCode },
      toolkit,
    );
  };
  return { run, request: requestImpl, logger };
}

describe('registerRevokeAPITokenOnLogout', () => {
  it.each([
    ['post /auth/logout', 200],
    ['post /api/v1/auth/logout', 200],
    ['post /auth/proxy/logout', 200],
    ['get /auth/openid/logout', 302],
    ['get /auth/saml/logout', 302],
  ])('revokes the token and expires its cookie on %s', (route, statusCode) => {
    const { run, request } = setup();

    expect(run(route, { statusCode })).toEqual(EXPIRE_COOKIE);
    expect(request).toHaveBeenCalledWith(
      'DELETE',
      '/security/user/authenticate',
      {},
      { apiHostID: 'default' },
    );
  });

  it.each([
    ['get /auth/logout', 404],
    ['post /x/auth/logout', 404],
    ['post /auth/logout', 400],
    ['get /auth/saml/logout', 400],
    ['post /api/request', 200],
    ['post /auth/login', 200],
  ])('does nothing on %s (status %p)', (route, statusCode) => {
    const { run, request } = setup();

    expect(run(route, { statusCode })).toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('does nothing without the wz-token cookie', () => {
    const { run, request } = setup();

    expect(run('post /auth/logout', { cookie: 'wz-api=default' })).toBe(
      undefined,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('expires the cookie without revoking when the API host is unknown', () => {
    const { run, request } = setup();

    expect(run('post /auth/logout', { cookie: 'wz-token=abc' })).toEqual(
      EXPIRE_COOKIE,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('logs a failed revocation without blocking the logout', async () => {
    const { run, logger } = setup(
      jest.fn().mockRejectedValue(new Error('timeout')),
    );

    expect(run('post /auth/logout')).toEqual(EXPIRE_COOKIE);
    await new Promise(process.nextTick);
    expect(logger.warn).toHaveBeenCalledWith(
      'Could not revoke the Server API token on logout: timeout',
    );
  });
});
