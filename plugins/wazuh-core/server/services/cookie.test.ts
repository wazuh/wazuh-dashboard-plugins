/*
 * Wazuh app - Cookie util functions tests
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { getCookieValueByName } from './cookie';

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
