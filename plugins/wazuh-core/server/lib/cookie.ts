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

export const getCookieValueByName = (cookie: string, name: string): (string | undefined) => {
  if (!cookie) return;
  const cookieRegExp = new RegExp(`.*${name}=([^;]+)`);
  const [_, cookieNameValue] = cookie.match(cookieRegExp) || [];
  return cookieNameValue;
}