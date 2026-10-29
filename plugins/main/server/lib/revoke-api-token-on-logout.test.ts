import { registerRevokeAPITokenOnLogout } from './revoke-api-token-on-logout';

const COOKIE = 'wz-token=abc; wz-api=default; security_authentication=xyz';

function setup(requestImpl = jest.fn().mockResolvedValue({})) {
  let handler;
  let preResponse;
  const http = {
    registerOnPostAuth: jest.fn(fn => (handler = fn)),
    registerOnPreResponse: jest.fn(fn => (preResponse = fn)),
  };
  const logger = { warn: jest.fn() };
  const asScoped = jest.fn(() => ({ request: requestImpl }));
  registerRevokeAPITokenOnLogout(http, {
    serverAPIClient: { asScoped },
    logger,
  });
  const toolkit = { next: jest.fn(() => 'next') };
  const run = (pathname: string, cookie = COOKIE) =>
    handler({ url: { pathname }, headers: { cookie } }, {}, toolkit);
  const respond = (pathname: string, cookie = COOKIE, statusCode = 200) => {
    preResponse(
      { url: { pathname }, headers: { cookie } },
      { statusCode },
      toolkit,
    );
    return toolkit.next.mock.calls[0][0];
  };
  return { run, respond, request: requestImpl, logger, toolkit };
}

describe('registerRevokeAPITokenOnLogout', () => {
  it.each([
    '/auth/logout',
    '/api/v1/auth/logout',
    '/auth/openid/logout',
    '/auth/saml/logout',
    '/auth/proxy/logout',
  ])('revokes the token on %s', pathname => {
    const { run, request } = setup();

    expect(run(pathname)).toBe('next');
    expect(request).toHaveBeenCalledWith(
      'DELETE',
      '/security/user/authenticate',
      {},
      { apiHostID: 'default' },
    );
  });

  it.each(['/api/request', '/auth/login', '/app/wz-home', '/auth/logout/x'])(
    'does nothing on %s',
    pathname => {
      const { run, request } = setup();

      expect(run(pathname)).toBe('next');
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each(['', 'wz-api=default', 'wz-token=abc'])(
    'does nothing without both cookies (%p)',
    cookie => {
      const { run, request } = setup();

      run('/auth/logout', cookie);
      expect(request).not.toHaveBeenCalled();
    },
  );

  it('logs a failed revocation without blocking the logout', async () => {
    const { run, logger } = setup(
      jest.fn().mockRejectedValue(new Error('timeout')),
    );

    expect(run('/auth/logout')).toBe('next');
    await new Promise(process.nextTick);
    expect(logger.warn).toHaveBeenCalledWith(
      'Could not revoke the Server API token on logout: timeout',
    );
  });

  it('expires the wz-token cookie on logout', () => {
    expect(setup().respond('/auth/logout')).toEqual({
      headers: { 'set-cookie': 'wz-token=; Path=/; Max-Age=0; HttpOnly' },
    });
  });

  it.each([
    ['/api/request', COOKIE, 200],
    ['/auth/logout', 'wz-api=default', 200],
    ['/auth/logout', COOKIE, 400],
  ])(
    'keeps the response headers on %s (cookie: %p, status %p)',
    (pathname, cookie, statusCode) => {
      expect(setup().respond(pathname, cookie, statusCode)).toBeUndefined();
    },
  );
});
