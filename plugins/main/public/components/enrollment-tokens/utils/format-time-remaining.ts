/*
 * Wazuh app - Relative-time rendering of an enrollment token's expiry
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

/* Largest unit first: a token minted for 30 days is the common case, but the
manager accepts a ttl down to a single second, so the table has to read
sensibly at every scale rather than only in days. */
type TimeUnit = 'day' | 'hour' | 'minute' | 'second';

interface RoundedDuration {
  unit: TimeUnit;
  amount: number;
}

const UNITS: { unit: TimeUnit; ms: number }[] = [
  { unit: 'day', ms: 86400000 },
  { unit: 'hour', ms: 3600000 },
  { unit: 'minute', ms: 60000 },
  { unit: 'second', ms: 1000 },
];

const roundToLargestUnit = (durationMs: number): RoundedDuration => {
  const { unit, ms } =
    UNITS.find(({ ms: unitMs }) => durationMs >= unitMs) ??
    UNITS[UNITS.length - 1];

  return { unit, amount: Math.max(1, Math.floor(durationMs / ms)) };
};

/* One whole message per unit and direction, so a translation can inflect the
unit and place it around the amount as its language needs. */
const formatTimeLeft = ({ unit, amount }: RoundedDuration): string => {
  const values = { amount };

  switch (unit) {
    case 'day':
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.daysLeft',
        {
          defaultMessage:
            '{amount, plural, one {{amount} day left} other {{amount} days left}}',
          values,
        },
      );
    case 'hour':
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.hoursLeft',
        {
          defaultMessage:
            '{amount, plural, one {{amount} hour left} other {{amount} hours left}}',
          values,
        },
      );
    case 'minute':
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.minutesLeft',
        {
          defaultMessage:
            '{amount, plural, one {{amount} minute left} other {{amount} minutes left}}',
          values,
        },
      );
    default:
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.secondsLeft',
        {
          defaultMessage:
            '{amount, plural, one {{amount} second left} other {{amount} seconds left}}',
          values,
        },
      );
  }
};

const formatExpiredAgo = ({ unit, amount }: RoundedDuration): string => {
  const values = { amount };

  switch (unit) {
    case 'day':
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.expiredDaysAgo',
        {
          defaultMessage:
            '{amount, plural, one {Expired {amount} day ago} other {Expired {amount} days ago}}',
          values,
        },
      );
    case 'hour':
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.expiredHoursAgo',
        {
          defaultMessage:
            '{amount, plural, one {Expired {amount} hour ago} other {Expired {amount} hours ago}}',
          values,
        },
      );
    case 'minute':
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.expiredMinutesAgo',
        {
          defaultMessage:
            '{amount, plural, one {Expired {amount} minute ago} other {Expired {amount} minutes ago}}',
          values,
        },
      );
    default:
      return i18n.translate(
        'wazuh.enrollmentTokens.formatTimeRemaining.expiredSecondsAgo',
        {
          defaultMessage:
            '{amount, plural, one {Expired {amount} second ago} other {Expired {amount} seconds ago}}',
          values,
        },
      );
  }
};

/**
 * How long is left until the token expires, or how long ago it did, in the
 * coarsest unit that still says something -- "3 days left", "Expired 4 days
 * ago". Never the reason it stopped working otherwise (revoked, exhausted):
 * only the expiry date says that here.
 */
export const formatTimeRemaining = (
  expires?: string,
  now: number = Date.now(),
): string => {
  if (!expires) {
    return '-';
  }

  const expiresAt = Date.parse(expires);

  if (Number.isNaN(expiresAt)) {
    return '-';
  }

  const diff = expiresAt - now;

  return diff > 0
    ? formatTimeLeft(roundToLargestUnit(diff))
    : formatExpiredAgo(roundToLargestUnit(Math.abs(diff)));
};
