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

/** How long to wait for the Security plugin config before falling back. */
const SECURITY_CONFIG_TIMEOUT_MS = 5000;

/**
 * Resolves the `Secure` flag for the Wazuh server API session cookies.
 *
 * Normally the listener protocol decides. That is wrong in exactly one
 * topology: when a reverse proxy terminates TLS, the dashboard itself speaks
 * plain HTTP while the browser connection is encrypted. The Security plugin
 * already exposes an administrator override for that case, so we read the same
 * `opensearch_security.cookie.secure` value instead of adding a second setting
 * that could disagree with it.
 *
 * Falls back to the protocol when the Security plugin is absent (Search Guard,
 * or no security plugin at all), when the setting is unset, or when the config
 * cannot be read.
 */
export async function resolveCookieSecure(
  plugins: PluginSetup,
  isHttps: boolean,
): Promise<boolean> {
  const securityConfig = await (plugins.securityDashboards?.config$
    ? plugins.securityDashboards.config$
        .pipe(
          first(),
          timeout(SECURITY_CONFIG_TIMEOUT_MS),
          catchError(() => of(undefined)),
        )
        .toPromise()
    : Promise.resolve(undefined));

  return securityConfig?.cookie?.secure ?? isHttps;
}
