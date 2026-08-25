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

import { Logger } from 'opensearch_dashboards/server';
import { of, throwError } from 'rxjs';
import { resolveCookieSameSite } from './cookie';
import { PluginSetup } from '../types';

const logger = { error: jest.fn() } as unknown as Logger;

type SameSite = 'Strict' | 'Lax' | 'None' | false | undefined;

const pluginsWith = (isSameSite: SameSite): PluginSetup =>
  ({
    securityDashboards: { config$: of({ cookie: { isSameSite } }) },
  } as unknown as PluginSetup);

describe('resolveCookieSameSite', () => {
  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it('mirrors the value configured in the Security plugin', async () => {
    await expect(
      resolveCookieSameSite(pluginsWith('Strict'), true, logger),
    ).resolves.toBe('Strict');
    await expect(
      resolveCookieSameSite(pluginsWith('Lax'), true, logger),
    ).resolves.toBe('Lax');
  });

  it('falls back to Lax when the setting is unset', async () => {
    await expect(
      resolveCookieSameSite(pluginsWith(false), true, logger),
    ).resolves.toBe('Lax');
    await expect(
      resolveCookieSameSite(pluginsWith(undefined), true, logger),
    ).resolves.toBe('Lax');
  });

  it('falls back to Lax when the Security plugin is absent', async () => {
    await expect(
      resolveCookieSameSite({} as PluginSetup, true, logger),
    ).resolves.toBe('Lax');
  });

  it('falls back to Lax when the contract does not expose config$', async () => {
    const plugins = { securityDashboards: {} } as PluginSetup;
    await expect(resolveCookieSameSite(plugins, true, logger)).resolves.toBe(
      'Lax',
    );
  });

  it('falls back to Lax when the config observable errors', async () => {
    const plugins = {
      securityDashboards: { config$: throwError(new Error('boom')) },
    } as unknown as PluginSetup;
    await expect(resolveCookieSameSite(plugins, true, logger)).resolves.toBe(
      'Lax',
    );
  });

  it('keeps None over HTTPS', async () => {
    await expect(
      resolveCookieSameSite(pluginsWith('None'), true, logger),
    ).resolves.toBe('None');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('downgrades None to Lax over plain HTTP and logs the reason', async () => {
    await expect(
      resolveCookieSameSite(pluginsWith('None'), false, logger),
    ).resolves.toBe('Lax');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
