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
import { i18n } from '@osd/i18n';

/* The manager takes the token lifetime as a plain number of seconds, or as a
number followed by `d`, `h`, `m` or `s`. It is validated here because an
unparseable timeframe resolves to 0 on the manager side rather than being
refused. Left empty, the manager applies its own default of 30 days. It refuses
a lifetime over 3650 days, which is mirrored here so the limit is reported under
the field instead of as a raw API error. */
const TTL_MAX_DAYS = 3650;
const TTL_SECONDS_PER_UNIT: Record<string, number> = {
  '': 1,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};
const TTL_MAX_SECONDS = TTL_MAX_DAYS * TTL_SECONDS_PER_UNIT.d;

export const validateEnrollmentTokenTtl = (value: string) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const ttl = value.trim();
  if (!/^\d+[dhms]?$/.test(ttl)) {
    return i18n.translate('wazuh.enrollmentTokens.validation.ttlFormat', {
      defaultMessage:
        'The lifetime must be a number of seconds, or a number followed by "d", "h", "m" or "s". For example: 30d, 12h, 3600.',
    });
  }
  if (Number.parseInt(ttl, 10) === 0) {
    return i18n.translate('wazuh.enrollmentTokens.validation.ttlPositive', {
      defaultMessage: 'The lifetime must be greater than 0.',
    });
  }
  const [, amount, unit] = ttl.match(/^(\d+)([dhms]?)$/) as RegExpMatchArray;
  if (Number(amount) * TTL_SECONDS_PER_UNIT[unit] > TTL_MAX_SECONDS) {
    return i18n.translate('wazuh.enrollmentTokens.validation.ttlMax', {
      defaultMessage:
        'The lifetime can be at most {maxDays} days (10 years). For example: {maxDays}d.',
      values: { maxDays: TTL_MAX_DAYS },
    });
  }
  return undefined;
};

/* The manager only accepts letters, digits, whitespace and a fixed set of
symbols in the description, up to 256 characters, and refuses the rest (for
example `&`) with a schema message that names no character. The rule is
mirrored here so the offending characters are reported under the field. */
const DESCRIPTION_MAX_LENGTH = 256;
const DESCRIPTION_ALLOWED_SYMBOLS = ',*<>!-.+:/()[]\'"|=~#';
const DESCRIPTION_ALLOWED_CHARACTER = /[\p{L}\p{N}_\s,*<>!\-.+:/()[\]'"|=~#]/u;

export const validateEnrollmentTokenDescription = (value: string) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const invalid = Array.from(
    new Set(
      Array.from(value).filter(
        character => !DESCRIPTION_ALLOWED_CHARACTER.test(character),
      ),
    ),
  );
  if (invalid.length > 0) {
    return i18n.translate(
      'wazuh.enrollmentTokens.validation.descriptionChars',
      {
        defaultMessage:
          'The description cannot contain: {invalid}. Allowed: letters, digits, spaces and {symbols}.',
        values: {
          invalid: invalid.join(' '),
          symbols: DESCRIPTION_ALLOWED_SYMBOLS.split('').join(' '),
        },
      },
    );
  }
  if (Array.from(value).length > DESCRIPTION_MAX_LENGTH) {
    return i18n.translate(
      'wazuh.enrollmentTokens.validation.descriptionLength',
      {
        defaultMessage: 'The description can have at most {max} characters.',
        values: { max: DESCRIPTION_MAX_LENGTH },
      },
    );
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
    return i18n.translate('wazuh.enrollmentTokens.validation.maxUses', {
      defaultMessage:
        'The number of enrollments must be a whole number of 0 or more, where 0 means unlimited.',
    });
  }
  return undefined;
};
