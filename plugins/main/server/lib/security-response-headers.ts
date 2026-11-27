/*
 * Wazuh app - Security headers added to every dashboard response
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { HttpServiceSetup } from 'opensearch_dashboards/server';

/**
 * Add the security headers to every response of the dashboard. Serving over
 * HTTPS adds Strict-Transport-Security.
 */
export function registerSecurityResponseHeaders(
  http: Pick<HttpServiceSetup, 'registerOnPreResponse'>,
  { https }: { https: boolean },
) {
  const headers: Record<string, string> = {
    'x-frame-options': 'sameorigin',
    'x-content-type-options': 'nosniff',
    // Puts the dashboard in its own browsing context group, so a cross-origin
    // page that opened the dashboard, or that the dashboard opened, keeps no
    // window reference to it and cannot navigate its tab.
    // `same-origin-allow-popups` would keep the reference to the windows the
    // dashboard opens.
    'cross-origin-opener-policy': 'same-origin',
    // Other origins can't load responses to learn if the user is logged in
    'cross-origin-resource-policy': 'same-origin',
  };

  // HSTS is only honoured by browsers over TLS. Emitting it from a plain
  // HTTP listener would be a no-op, and a deployment that terminates TLS at
  // a proxy must set the header there, where the real protocol is known.
  // `includeSubDomains` is deliberately omitted: a browser pins it for the
  // whole max-age and it would reach unrelated hosts on sibling subdomains.
  if (https) {
    headers['strict-transport-security'] = 'max-age=31536000';
  }

  http.registerOnPreResponse((request, response, toolkit) =>
    toolkit.next({ headers }),
  );
}
