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

function createClient() {
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

describe('ServerAPIClient rate limit (429)', () => {
  interface RateLimitClientInternals {
    _axios: jest.Mock;
    _request: (
      method: string,
      path: string,
      data: unknown,
      options: unknown,
    ) => Promise<unknown>;
    _authenticate: (
      apiHostID: string,
      options: { useRunAs: boolean },
    ) => Promise<string>;
  }

  const RATE_LIMITED_MESSAGE =
    'The server API [default] is rate limiting the requests of the dashboard (status code 429)';
  const rateLimited = () => ({
    message: 'Request failed with status code 429',
    code: 'ERR_BAD_REQUEST',
    response: { status: 429, headers: {} },
  });
  const serverError = () => ({
    message: 'Request failed with status code 500',
    response: { status: 500, headers: {} },
  });

  const setup = () => {
    const { client, logger } = createClient();
    const internals = client as unknown as RateLimitClientInternals;
    internals._axios = jest.fn();
    const request = () =>
      internals._request(
        'GET',
        '/agents',
        {},
        {
          apiHostID: 'default',
          token: 'server-session-token',
        },
      );
    const authenticate = () =>
      internals._authenticate('default', { useRunAs: false });

    return { internals, logger, request, authenticate };
  };

  it('does not retry a 429 answer and reports the rate limiting', async () => {
    const { internals, logger, request } = setup();
    internals._axios.mockRejectedValue(rateLimited());

    await expect(request()).rejects.toMatchObject({
      message: RATE_LIMITED_MESSAGE,
      code: 'ERR_BAD_REQUEST',
      response: { status: 429 },
    });
    expect(internals._axios).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('does not retry a 429 answer to the login request', async () => {
    const { internals, authenticate } = setup();
    internals._axios.mockRejectedValue(rateLimited());

    await expect(authenticate()).rejects.toMatchObject({
      message: RATE_LIMITED_MESSAGE,
      response: { status: 429 },
    });
    expect(internals._axios).toHaveBeenCalledTimes(1);
    expect(internals._axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://server-api:55000/security/user/authenticate',
      }),
    );
  });

  it('keeps an answer that is not a 429 as it is', async () => {
    const { internals, request } = setup();
    internals._axios.mockRejectedValue(serverError());

    await expect(request()).rejects.toMatchObject({
      message: 'Request failed with status code 500',
      response: { status: 500 },
    });
    expect(internals._axios).toHaveBeenCalledTimes(1);
  });

  it('does not retry an error without a response', async () => {
    const { internals, request } = setup();
    internals._axios.mockRejectedValue(
      Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
      }),
    );

    await expect(request()).rejects.toMatchObject({ code: 'ECONNREFUSED' });
    expect(internals._axios).toHaveBeenCalledTimes(1);
  });
});
