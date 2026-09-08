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
  username: 'wazuh-wui',
  password: 'wazuh-wui',
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
