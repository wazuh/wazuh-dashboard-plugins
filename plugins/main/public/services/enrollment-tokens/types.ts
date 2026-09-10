/*
 * Wazuh app - Types of the `/agents/enrollment-tokens` resources
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* What the Server API is asked to mint. Only the address is required: the
manager reads the port and the path prefix from its own listener when they are
omitted, applies a 30 day lifetime, and allows unlimited enrollments. */
export interface EnrollmentTokenRequest {
  address: string;
  port?: string | number;
  prefix?: string;
  ttl?: string;
  maxUses?: string | number;
  description?: string;
  embedCa?: boolean;
  noCredential?: boolean;
}

/* What the manager answers when it mints one. `token` is the text the agent is
installed with and is returned by this response only -- listing the tokens later
never gives it back, which is why an operator who wants to reuse a token has to
have kept it. */
export interface MintedEnrollmentToken {
  token: string;
  id: string;
  address: string;
  expires: string;
  pin_hex?: string;
}

/* One row of the listing. The token text and its credential are never part of
it, so a token is identified here only by its id. Every field is optional in the
spec: `select` strips the ones the caller did not ask for. */
export interface EnrollmentTokenSummary {
  id?: string;
  address?: string;
  created?: string;
  expires?: string;
  max_uses?: number;
  uses?: number;
  revoked?: boolean;
  credential?: boolean;
  description?: string | null;
}

/* Which tokens a purge removes. `dead` -- the default -- only takes the ones
that can no longer authorise an enrollment; `all` empties the store. */
export type EnrollmentTokenPurgeStatus = 'dead' | 'all';
