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
import { getCookieValueByName, resolveCookieSecure } from './cookie';
import { PluginSetup } from '../types';

const pluginsWith = (secure?: boolean): PluginSetup =>
  ({
    securityDashboards: { config$: of({ cookie: { secure } }) },
  }) as PluginSetup;

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

describe('getCookieValueByName', () => {
  it.each`
    cookie                               | name          | expected
    ${'wz-token=abc'}                    | ${'wz-token'} | ${'abc'}
    ${'a=1; wz-api=host-1; b=2'}         | ${'wz-api'}   | ${'host-1'}
    ${'  wz-user = admin%40x ;a=1'}      | ${'wz-user'}  | ${'admin%40x'}
    ${'jwt=a.b=c; wz-token=x=y'}         | ${'wz-token'} | ${'x=y'}
    ${'wz-token=first; wz-token=second'} | ${'wz-token'} | ${'first'}
    ${'xwz-token=evil; a=1'}             | ${'wz-token'} | ${undefined}
    ${'wz-token=; a=1'}                  | ${'wz-token'} | ${undefined}
    ${'wz-token; a=1'}                   | ${'wz-token'} | ${undefined}
    ${'a=1; b=2'}                        | ${'wz-token'} | ${undefined}
    ${''}                                | ${'wz-token'} | ${undefined}
    ${undefined}                         | ${'wz-token'} | ${undefined}
  `(
    'returns $expected for $name in "$cookie"',
    ({ cookie, name, expected }) => {
      expect(getCookieValueByName(cookie, name)).toBe(expected);
    },
  );

  it('parses a 64 KB header without the cookie in linear time', () => {
    const cookie = `x=${'a'.repeat(30)}; `.repeat(2000);
    const start = Date.now();
    expect(getCookieValueByName(cookie, 'wz-token')).toBeUndefined();
    expect(Date.now() - start).toBeLessThan(100);
  });
});
