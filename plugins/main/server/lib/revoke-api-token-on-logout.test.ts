import { registerRevokeAPITokenOnLogout } from './revoke-api-token-on-logout';

const COOKIE = 'wz-token=abc; wz-api=default; security_authentication=xyz';

function setup(requestImpl = jest.fn().mockResolvedValue({})) {
  let handler;
  const http = { registerOnPostAuth: jest.fn(fn => (handler = fn)) };
  const logger = { warn: jest.fn() };
  const asScoped = jest.fn(() => ({ request: requestImpl }));
  registerRevokeAPITokenOnLogout(http, {
    serverAPIClient: { asScoped },
    logger,
  });
  const toolkit = { next: jest.fn(() => 'next') };
  const run = (pathname: string, cookie = COOKIE) =>
    handler({ url: { pathname }, headers: { cookie } }, {}, toolkit);
  return { run, request: requestImpl, logger, toolkit };
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
});
