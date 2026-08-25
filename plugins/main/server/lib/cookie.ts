/*
 * Wazuh app - Cookie util functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { Logger } from 'opensearch_dashboards/server';
import { of } from 'rxjs';
import { catchError, first, timeout } from 'rxjs/operators';
import { PluginSetup } from '../types';

export const getCookieValueByName = (
  cookie: string,
  name: string,
): string | undefined => {
  if (!cookie) return;
  const cookieRegExp = new RegExp(`.*${name}=([^;]+)`);
  const [_, cookieNameValue] = cookie.match(cookieRegExp) || [];
  return cookieNameValue;
};

/** Default when the Security plugin is absent or does not expose its config. */
const DEFAULT_COOKIE_SAME_SITE = 'Lax';

/** How long to wait for the Security plugin config before falling back. */
const SECURITY_CONFIG_TIMEOUT_MS = 5000;

/**
 * Resolves the SameSite attribute for the Wazuh server API session cookies.
 *
 * The value is not a setting of our own: we mirror
 * `opensearch_security.cookie.isSameSite` so the platform session cookie and
 * the Wazuh API cookies always share one policy. When the Security plugin is
 * absent (Search Guard, or no security plugin at all), or when the setting is
 * unset, we fall back to `Lax` — which is what Chrome and Edge already apply to
 * a cookie with no SameSite attribute.
 *
 * `SameSite=None` without `Secure` is rejected outright by browsers, so it is
 * downgraded here rather than silently producing a cookie that is dropped.
 */
export async function resolveCookieSameSite(
  plugins: PluginSetup,
  isHttps: boolean,
  logger: Logger,
): Promise<'Strict' | 'Lax' | 'None'> {
  const securityConfig = await (plugins.securityDashboards?.config$
    ? plugins.securityDashboards.config$
        .pipe(
          first(),
          timeout(SECURITY_CONFIG_TIMEOUT_MS),
          catchError(() => of(undefined)),
        )
        .toPromise()
    : Promise.resolve(undefined));

  const configured = securityConfig?.cookie?.isSameSite;

  if (!configured) {
    return DEFAULT_COOKIE_SAME_SITE;
  }

  if (configured === 'None' && !isHttps) {
    logger.error(
      'opensearch_security.cookie.isSameSite is None but the server does not use HTTPS. ' +
        `Browsers reject SameSite=None without Secure, so ${DEFAULT_COOKIE_SAME_SITE} is used ` +
        'for the Wazuh server API cookies.',
    );
    return DEFAULT_COOKIE_SAME_SITE;
  }

  return configured;
}
