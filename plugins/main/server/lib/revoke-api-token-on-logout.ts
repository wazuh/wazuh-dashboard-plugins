/*
 * Wazuh app - Revoke the user's Server API token on logout
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import {
  HttpServiceSetup,
  Logger,
  OpenSearchDashboardsRequest,
} from 'opensearch_dashboards/server';
import { getCookieValueByName } from './cookie';

// Logout routes of the security plugin: /auth/logout, /api/v1/auth/logout, /auth/<type>/logout
const LOGOUT_PATH = /\/auth\/(?:[a-z]+\/)?logout$/;

interface ServerAPIClient {
  asScoped: (
    context: unknown,
    request: OpenSearchDashboardsRequest,
  ) => {
    request: (
      method: string,
      path: string,
      data: unknown,
      options: { apiHostID: string },
    ) => Promise<unknown>;
  };
}

/**
 * Revoke the Server API token of the user when they log out of the dashboard,
 * from any app and any logout method, and expire its cookie so the next login
 * does not reuse it.
 */
export function registerRevokeAPITokenOnLogout(
  http: Pick<HttpServiceSetup, 'registerOnPostAuth' | 'registerOnPreResponse'>,
  {
    serverAPIClient,
    logger,
  }: { serverAPIClient: ServerAPIClient; logger: Logger },
) {
  // Post-auth, so the core XSRF check rejects forged requests first
  http.registerOnPostAuth((request, response, toolkit) => {
    const { cookie } = request.headers;
    const token = getCookieValueByName(cookie, 'wz-token');
    const apiHostID = getCookieValueByName(cookie, 'wz-api');

    if (token && apiHostID && LOGOUT_PATH.test(request.url.pathname || '')) {
      // Not awaited, so the logout is not delayed by the Server API
      serverAPIClient
        .asScoped({}, request)
        .request('DELETE', '/security/user/authenticate', {}, { apiHostID })
        .catch(error =>
          logger.warn(
            `Could not revoke the Server API token on logout: ${
              error.message || error
            }`,
          ),
        );
    }

    return toolkit.next();
  });

  // Only on a completed logout, not on one the XSRF check rejected
  http.registerOnPreResponse((request, response, toolkit) => {
    if (
      response.statusCode < 400 &&
      LOGOUT_PATH.test(request.url.pathname || '') &&
      getCookieValueByName(request.headers.cookie, 'wz-token')
    ) {
      return toolkit.next({
        headers: { 'set-cookie': 'wz-token=; Path=/; Max-Age=0; HttpOnly' },
      });
    }

    return toolkit.next();
  });
}
