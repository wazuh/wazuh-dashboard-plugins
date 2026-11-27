/*
 * Wazuh app - Block loads of dashboard resources from other sites
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { HttpServiceSetup, Logger } from 'opensearch_dashboards/server';

type RequestHeaders = Record<string, string | string[] | undefined>;

/**
 * True for a browser request that a page of another origin sent to load a
 * resource without CORS (`<img>`, `<script>`, `<link rel="prefetch">`…) or to
 * fill an `<object>` or `<embed>`. Top-level and frame navigations (links, SSO
 * callbacks), CORS requests and clients without fetch metadata are not.
 */
export function isCrossSiteLoad(headers: RequestHeaders): boolean {
  const site = headers['sec-fetch-site'];
  if (site !== 'same-site' && site !== 'cross-site') {
    return false;
  }
  const mode = headers['sec-fetch-mode'];
  const dest = headers['sec-fetch-dest'];
  return (
    mode === 'no-cors' ||
    (mode === 'navigate' && (dest === 'object' || dest === 'embed'))
  );
}

/**
 * Stop pages of other origins from loading dashboard responses, which would
 * tell them whether the user is logged in and roughly which role they have.
 * The browser is told with `Cross-Origin-Resource-Policy`, and the server
 * refuses the loads of browsers that do not enforce it.
 */
export function registerBlockCrossSiteLoads(
  http: Pick<HttpServiceSetup, 'registerOnPreAuth' | 'registerOnPreResponse'>,
  { logger }: { logger: Logger },
) {
  // Not on pre-routing: there, refusing the first request after a start makes
  // the hapi request metrics throw and the server exit.
  http.registerOnPreAuth((request, response, toolkit) => {
    if (!isCrossSiteLoad(request.headers)) {
      return toolkit.next();
    }
    logger.debug(`Refused a cross-site load of ${request.url.pathname}`);
    return response.forbidden({
      body: { message: 'Loads from other sites are not allowed' },
    });
  });

  http.registerOnPreResponse((request, response, toolkit) =>
    toolkit.next({
      headers: { 'cross-origin-resource-policy': 'same-origin' },
    }),
  );
}
