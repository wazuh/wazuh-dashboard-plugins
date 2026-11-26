import {
  isCrossSiteLoad,
  registerBlockCrossSiteLoads,
} from './cross-site-loads';

const fetchMetadata = (site?: string, mode?: string, dest?: string) => ({
  'sec-fetch-site': site,
  'sec-fetch-mode': mode,
  'sec-fetch-dest': dest,
});

describe('isCrossSiteLoad', () => {
  it.each([
    ['same-site', 'no-cors', 'empty'],
    ['cross-site', 'no-cors', 'script'],
    ['same-site', 'no-cors', 'image'],
    ['same-site', 'navigate', 'object'],
    ['cross-site', 'navigate', 'embed'],
  ])('is true for site %s, mode %s, dest %s', (site, mode, dest) => {
    expect(isCrossSiteLoad(fetchMetadata(site, mode, dest))).toBe(true);
  });

  it.each([
    // Clients without fetch metadata: curl, API scripts, health checks
    [undefined, undefined, undefined],
    ['same-origin', 'no-cors', 'script'],
    ['same-origin', 'cors', 'empty'],
    ['none', 'navigate', 'document'],
    // Links, redirects, SSO callbacks (SAML POST, OpenID GET)
    ['cross-site', 'navigate', 'document'],
    ['same-site', 'navigate', 'document'],
    ['cross-site', 'navigate', 'iframe'],
    // CORS requests cannot read the response without the server's consent
    ['cross-site', 'cors', 'empty'],
    ['same-site', 'cors', 'empty'],
  ])('is false for site %s, mode %s, dest %s', (site, mode, dest) => {
    expect(isCrossSiteLoad(fetchMetadata(site, mode, dest))).toBe(false);
  });
});

describe('registerBlockCrossSiteLoads', () => {
  function setup() {
    const http = {
      registerOnPreAuth: jest.fn(),
      registerOnPreResponse: jest.fn(),
      registerOnPreRouting: jest.fn(),
    };
    const logger = { debug: jest.fn() };
    registerBlockCrossSiteLoads(http, { logger });
    const [preAuth] = http.registerOnPreAuth.mock.calls[0];
    const [preResponse] = http.registerOnPreResponse.mock.calls[0];
    const response = {
      forbidden: jest.fn(options => ({ status: 403, options })),
    };
    const toolkit = { next: jest.fn(options => ({ next: options })) };
    const request = (headers: Record<string, string | undefined>) => ({
      headers,
      url: { pathname: '/api/v1/auth/authinfo' },
    });
    return { http, logger, preAuth, preResponse, response, toolkit, request };
  }

  it('checks the request before authentication, not before routing', () => {
    const { http } = setup();

    expect(http.registerOnPreAuth).toHaveBeenCalledTimes(1);
    expect(http.registerOnPreRouting).not.toHaveBeenCalled();
  });

  it('refuses a cross-site load with 403 and logs it at debug level', () => {
    const { preAuth, response, toolkit, request, logger } = setup();

    const result = preAuth(
      request(fetchMetadata('same-site', 'no-cors', 'empty')),
      response,
      toolkit,
    );

    expect(result.status).toBe(403);
    expect(toolkit.next).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      'Refused a cross-site load of /api/v1/auth/authinfo',
    );
  });

  it('lets a navigation from another site through', () => {
    const { preAuth, response, toolkit, request } = setup();

    preAuth(
      request(fetchMetadata('cross-site', 'navigate', 'document')),
      response,
      toolkit,
    );

    expect(toolkit.next).toHaveBeenCalledWith();
    expect(response.forbidden).not.toHaveBeenCalled();
  });

  it('adds Cross-Origin-Resource-Policy: same-origin to every response', () => {
    const { preResponse, toolkit } = setup();

    expect(preResponse({}, { statusCode: 200 }, toolkit)).toEqual({
      next: { headers: { 'cross-origin-resource-policy': 'same-origin' } },
    });
  });
});
