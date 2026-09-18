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

/* Largest unit first: a token minted for 30 days is the common case, but the
manager accepts a ttl down to a single second, so the table has to read
sensibly at every scale rather than only in days. */
const UNITS: { unit: string; ms: number }[] = [
  { unit: 'day', ms: 86400000 },
  { unit: 'hour', ms: 3600000 },
  { unit: 'minute', ms: 60000 },
  { unit: 'second', ms: 1000 },
];

const roundToLargestUnit = (durationMs: number): string => {
  const { unit, ms } =
    UNITS.find(({ ms: unitMs }) => durationMs >= unitMs) ??
    UNITS[UNITS.length - 1];
  const amount = Math.max(1, Math.floor(durationMs / ms));

  return `${amount} ${unit}${amount === 1 ? '' : 's'}`;
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
    ? `${roundToLargestUnit(diff)} left`
    : `Expired ${roundToLargestUnit(Math.abs(diff))} ago`;
};
