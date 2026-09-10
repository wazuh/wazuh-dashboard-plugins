/*
 * Wazuh app - State an enrollment token is in, derived from the listing
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EnrollmentTokenSummary } from '../../../services/enrollment-tokens';

/* The three ways a token stops authorising enrollments are what the manager
calls a dead token, and what a purge with `status=dead` removes. They are
derived here rather than read from a field because the listing reports the
facts -- revoked, expiry, uses -- and not the conclusion. */
export type EnrollmentTokenStatus =
  | 'active'
  | 'revoked'
  | 'expired'
  | 'exhausted';

export const getEnrollmentTokenStatus = (
  token: EnrollmentTokenSummary,
  now: number = Date.now(),
): EnrollmentTokenStatus => {
  if (token.revoked) {
    return 'revoked';
  }

  const expires = token.expires ? Date.parse(token.expires) : Number.NaN;

  /* An unparseable or absent expiry says nothing, so it is left alone: calling
  such a token expired would report a state the manager never claimed. */
  if (!Number.isNaN(expires) && expires <= now) {
    return 'expired';
  }

  /* `max_uses` of 0 means unlimited, so only a positive allowance can run
  out. */
  const maxUses = token.max_uses ?? 0;

  if (maxUses > 0 && (token.uses ?? 0) >= maxUses) {
    return 'exhausted';
  }

  return 'active';
};

export const ENROLLMENT_TOKEN_STATUS_LABEL: Record<
  EnrollmentTokenStatus,
  { label: string; color: string }
> = {
  active: { label: 'Active', color: 'success' },
  revoked: { label: 'Revoked', color: 'danger' },
  expired: { label: 'Expired', color: 'subdued' },
  exhausted: { label: 'Exhausted', color: 'warning' },
};
