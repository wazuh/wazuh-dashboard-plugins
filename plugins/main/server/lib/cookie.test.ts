/*
 * Wazuh app - Cookie util functions tests
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { of, throwError } from 'rxjs';
import { resolveCookieSecure } from './cookie';
import { PluginSetup } from '../types';

const pluginsWith = (secure?: boolean): PluginSetup =>
  ({
    securityDashboards: { config$: of({ cookie: { secure } }) },
  } as PluginSetup);

describe('resolveCookieSecure', () => {
  it('derives true from an HTTPS listener when the setting is unset', async () => {
    await expect(
      resolveCookieSecure(pluginsWith(undefined), true),
    ).resolves.toBe(true);
  });

  it('derives false from a plain HTTP listener when the setting is unset', async () => {
    await expect(
      resolveCookieSecure(pluginsWith(undefined), false),
    ).resolves.toBe(false);
  });

  it('honours an explicit true on a plain HTTP listener (TLS-terminating proxy)', async () => {
    await expect(resolveCookieSecure(pluginsWith(true), false)).resolves.toBe(
      true,
    );
  });

  it('honours an explicit false on an HTTPS listener', async () => {
    await expect(resolveCookieSecure(pluginsWith(false), true)).resolves.toBe(
      false,
    );
  });

  it('falls back to the protocol when the Security plugin is absent', async () => {
    await expect(resolveCookieSecure({} as PluginSetup, true)).resolves.toBe(
      true,
    );
  });

  it('falls back to the protocol when the contract does not expose config$', async () => {
    const plugins = { securityDashboards: {} } as PluginSetup;
    await expect(resolveCookieSecure(plugins, true)).resolves.toBe(true);
  });

  it('falls back to the protocol when the config observable errors', async () => {
    const plugins = {
      securityDashboards: { config$: throwError(new Error('boom')) },
    } as unknown as PluginSetup;
    await expect(resolveCookieSecure(plugins, true)).resolves.toBe(true);
  });
});
