/*
 * Wazuh app - Server API client tests
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { Logger } from 'opensearch-dashboards/server';
import { ServerAPIClient } from './server-api-client';
import { ManageHosts } from './manage-hosts';
import { ISecurityFactory } from './security-factory';

const API_HOST = {
  id: 'default',
  url: 'https://server-api',
  port: 55000,
  username: 'wazuh-internal-client',
  password: 'wazuh-internal-client',
};

interface RequestOptions {
  headers: Record<string, unknown>;
}

/* The header allowlist is applied while building the outbound request, so the
   test reaches for that private method instead of mocking the transport. */
interface ClientInternals {
  _buildRequestOptions: (
    method: string,
    path: string,
    data: unknown,
    options: unknown,
  ) => Promise<RequestOptions>;
}

// `requestUsername: undefined` stands for a request without authentication state
function createClient(
  { requestUsername }: { requestUsername: string | undefined } = {
    requestUsername: 'admin',
  },
) {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const manageHosts = {
    get: jest.fn().mockResolvedValue(API_HOST),
    resolveVerifyCa: jest.fn().mockReturnValue(false),
    isEnabledAuthWithRunAs: jest.fn().mockReturnValue(false),
  };
  const dashboardSecurity = {
    getCurrentUser: jest.fn().mockResolvedValue({ username: 'admin' }),
    getRequestUsername: jest.fn().mockReturnValue(requestUsername),
  };
  const client = new ServerAPIClient(
    logger as unknown as Logger,
    manageHosts as unknown as ManageHosts,
    dashboardSecurity as unknown as ISecurityFactory,
  );

  return { client, logger };
}

function buildRequestOptions(client: ServerAPIClient, data: unknown) {
  return (client as unknown as ClientInternals)._buildRequestOptions(
    'GET',
    '/agents',
    data,
    { apiHostID: 'default', token: 'server-session-token' },
  );
}

describe('ServerAPIClient._buildRequestOptions', () => {
  it('uses the token resolved by the server as Authorization', async () => {
    const { client } = createClient();
    const options = await buildRequestOptions(client, {});

    expect(options.headers.Authorization).toBe('Bearer server-session-token');
  });

  it('forwards the allowed content-type header', async () => {
    const { client } = createClient();
    const options = await buildRequestOptions(client, {
      headers: { 'content-type': 'application/xml' },
    });

    expect(options.headers['content-type']).toBe('application/xml');
  });

  // header must never replace the credential chosen by the server.
  it.each(['Authorization', 'authorization', 'AUTHORIZATION'])(
    'ignores a caller-supplied %s header',
    async headerName => {
      const { client } = createClient();
      const options = await buildRequestOptions(client, {
        headers: { [headerName]: 'Bearer token-from-the-client' },
      });

      expect(options.headers.Authorization).toBe('Bearer server-session-token');
      expect(JSON.stringify(options.headers)).not.toContain(
        'token-from-the-client',
      );
    },
  );

  it('ignores other headers that are not allowlisted', async () => {
    const { client, logger } = createClient();
    const options = await buildRequestOptions(client, {
      headers: {
        Cookie: 'wz-token=stolen',
        Host: 'attacker.local',
        'X-Forwarded-For': '127.0.0.1',
      },
    });

    expect(options.headers.Cookie).toBeUndefined();
    expect(options.headers.Host).toBeUndefined();
    expect(options.headers['X-Forwarded-For']).toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('does not fail when headers are missing or not an object', async () => {
    const { client } = createClient();

    await expect(buildRequestOptions(client, {})).resolves.toMatchObject({
      headers: { 'content-type': 'application/json' },
    });
    await expect(
      buildRequestOptions(client, { headers: 'not-an-object' }),
    ).resolves.toMatchObject({
      headers: { Authorization: 'Bearer server-session-token' },
    });
  });
});

describe('ServerAPIClient.asInternalUser.request', () => {
  const setup = () => {
    const { client } = createClient();
    const internals = client as unknown as {
      asInternalUser: { request: ServerAPIClient['asInternalUser']['request'] };
      _authenticate: jest.Mock;
      _request: jest.Mock;
    };
    internals._authenticate = jest.fn().mockResolvedValue('internal-token');
    internals._request = jest.fn().mockResolvedValue({ status: 200 });
    const request = () =>
      internals.asInternalUser.request(
        'GET',
        '/agents',
        {},
        {
          apiHostID: 'default',
        },
      );

    return { internals, request };
  };

  it('shares one login between parallel requests', async () => {
    const { internals, request } = setup();

    await Promise.all([request(), request()]);

    expect(internals._authenticate).toHaveBeenCalledTimes(1);
    expect(internals._request).toHaveBeenCalledTimes(2);
  });

  it('shares one new login when parallel requests get an expired token', async () => {
    const { internals, request } = setup();
    await request();
    internals._authenticate.mockClear();
    internals._authenticate.mockResolvedValue('new-token');
    const expired = { response: { status: 401 } };
    internals._request.mockImplementation((_method, _path, _data, { token }) =>
      token === 'internal-token'
        ? Promise.reject(expired)
        : Promise.resolve({ status: 200 }),
    );

    await expect(Promise.all([request(), request()])).resolves.toEqual([
      { status: 200 },
      { status: 200 },
    ]);
    expect(internals._authenticate).toHaveBeenCalledTimes(1);
  });

  it('logs in again after a failed login', async () => {
    const { internals, request } = setup();
    internals._authenticate.mockRejectedValueOnce(new Error('login failed'));

    await expect(request()).rejects.toThrow('login failed');
    await expect(request()).resolves.toEqual({ status: 200 });
    expect(internals._authenticate).toHaveBeenCalledTimes(2);
  });
});

describe('ServerAPIClient.asScoped.request', () => {
  const send = (cookie: string | undefined, requestUsername?: string) => {
    const { client } = createClient({ requestUsername });
    const internals = client as unknown as { _request: jest.Mock };
    internals._request = jest.fn().mockResolvedValue({ status: 200 });
    const request = { headers: { cookie } };

    // The token of the caller is always replaced by the one of the cookie
    return client
      .asScoped({}, request)
      .request(
        'GET',
        '/agents',
        {},
        { apiHostID: 'default', token: 'token-from-the-caller' },
      )
      .then(() => internals._request.mock.calls[0][3].token);
  };

  it('sends the token of the user of the request', async () => {
    await expect(send('wz-token=abc; wz-user=admin', 'admin')).resolves.toBe(
      'abc',
    );
  });

  it('decodes the username of the cookie', async () => {
    await expect(
      send('wz-token=abc; wz-user=jane%40example.com', 'jane@example.com'),
    ).resolves.toBe('abc');
  });

  // A session that ended without logging out leaves these cookies behind.
  it.each([
    ['belongs to another user', 'wz-token=abc; wz-user=readonly'],
    ['has no user', 'wz-token=abc'],
    ['has a malformed user', 'wz-token=abc; wz-user=%E0%A4%A'],
  ])('sends no token when the cookie %s', async (_name, cookie) => {
    await expect(send(cookie, 'admin')).resolves.toBeUndefined();
  });

  it('sends the token when the request has no authentication state', async () => {
    await expect(
      send('wz-token=abc; wz-user=readonly', undefined),
    ).resolves.toBe('abc');
  });

  it('sends no token without the cookie', async () => {
    await expect(send(undefined, 'admin')).resolves.toBeUndefined();
  });
});

describe('ServerAPIClient rate limit (429)', () => {
  interface RateLimitClientInternals {
    _axios: jest.Mock;
    _request: (...args: unknown[]) => Promise<unknown>;
    _authenticate: (...args: unknown[]) => Promise<unknown>;
  }

  it.each([
    [
      'request',
      (internals: RateLimitClientInternals) =>
        internals._request('GET', '/agents', {}, { apiHostID: 'default' }),
    ],
    [
      'login',
      (internals: RateLimitClientInternals) =>
        internals._authenticate('default', { useRunAs: false }),
    ],
  ])(
    'reports a 429 answer to the %s as rate limiting without retrying it',
    async (_name, send) => {
      const internals = createClient()
        .client as unknown as RateLimitClientInternals;
      internals._axios = jest.fn().mockRejectedValue({
        message: 'Request failed with status code 429',
        code: 'ERR_BAD_REQUEST',
        response: { status: 429 },
      });

      await expect(send(internals)).rejects.toMatchObject({
        message:
          'The server API [default] is rate limiting the requests of the dashboard (status code 429)',
        code: 'ERR_BAD_REQUEST',
        response: { status: 429 },
      });
      expect(internals._axios).toHaveBeenCalledTimes(1);
    },
  );
});
