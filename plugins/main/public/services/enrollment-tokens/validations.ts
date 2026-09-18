/*
 * Wazuh app - Validations of the enrollment token request values
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* The manager takes the token lifetime as a plain number of seconds, or as a
number followed by `d`, `h`, `m` or `s`. It is validated here because an
unparseable timeframe resolves to 0 on the manager side rather than being
refused. Left empty, the manager applies its own default of 30 days. */
export const validateEnrollmentTokenTtl = (value: string) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const ttl = value.trim();
  if (!/^\d+[dhms]?$/.test(ttl)) {
    return 'The lifetime must be a number of seconds, or a number followed by "d", "h", "m" or "s". For example: 30d, 12h, 3600.';
  }
  if (Number.parseInt(ttl, 10) === 0) {
    return 'The lifetime must be greater than 0.';
  }
  return undefined;
};

/* Enrollments the token allows. 0 means unlimited, which is also what leaving
the field empty gets, since the manager defaults to it. */
export const validateEnrollmentTokenMaxUses = (value: string | number) => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  if (!/^\d+$/.test(String(value).trim())) {
    return 'The number of enrollments must be a whole number of 0 or more, where 0 means unlimited.';
  }
  return undefined;
};
