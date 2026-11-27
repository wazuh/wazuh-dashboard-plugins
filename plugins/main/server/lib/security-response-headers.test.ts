import { registerSecurityResponseHeaders } from './security-response-headers';

function run(https: boolean) {
  let handler;
  const http = { registerOnPreResponse: jest.fn(fn => (handler = fn)) };
  registerSecurityResponseHeaders(http, { https });
  const toolkit = { next: jest.fn(response => response) };
  return handler({}, { statusCode: 200 }, toolkit);
}

describe('registerSecurityResponseHeaders', () => {
  it('sends the security headers and HSTS over HTTPS', () => {
    expect(run(true)).toEqual({
      headers: {
        'x-frame-options': 'sameorigin',
        'x-content-type-options': 'nosniff',
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-resource-policy': 'same-origin',
        'strict-transport-security': 'max-age=31536000',
      },
    });
  });

  it('sends the security headers without HSTS over HTTP', () => {
    expect(run(false)).toEqual({
      headers: {
        'x-frame-options': 'sameorigin',
        'x-content-type-options': 'nosniff',
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-resource-policy': 'same-origin',
      },
    });
  });
});
