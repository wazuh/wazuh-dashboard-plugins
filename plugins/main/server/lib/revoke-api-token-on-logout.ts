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

// Logout routes of the security plugin: basic, JWT, proxy, OpenID, SAML
const LOGOUT_ROUTES = new Set([
  'post /auth/logout',
  'post /api/v1/auth/logout',
  'post /auth/proxy/logout',
  'get /auth/openid/logout',
  'get /auth/saml/logout',
]);

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
  http: Pick<HttpServiceSetup, 'registerOnPreResponse'>,
  {
    serverAPIClient,
    logger,
  }: { serverAPIClient: ServerAPIClient; logger: Logger },
) {
  // On the response, so only a completed logout counts: not a 404, an XSRF
  // rejection (400) or a failed logout
  http.registerOnPreResponse((request, response, toolkit) => {
    if (
      response.statusCode >= 400 ||
      !LOGOUT_ROUTES.has(`${request.route.method} ${request.route.path}`)
    ) {
      return toolkit.next();
    }

    const { cookie } = request.headers;
    if (!getCookieValueByName(cookie, 'wz-token')) {
      return toolkit.next();
    }

    const apiHostID = getCookieValueByName(cookie, 'wz-api');
    if (apiHostID) {
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

    // Replaces any set-cookie header of the logout response. The security
    // plugin clears its session through hapi state, which is added later.
    return toolkit.next({
      headers: { 'set-cookie': 'wz-token=; Path=/; Max-Age=0; HttpOnly' },
    });
  });
}
