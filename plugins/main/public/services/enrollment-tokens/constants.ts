/*
 * Wazuh app - Constants of the enrollment tokens service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const ENROLLMENT_TOKENS_ENDPOINT = '/agents/enrollment-tokens';
export const CLUSTER_NODES_ENDPOINT = '/cluster/nodes';
export const listenerTlsEndpoint = (nodeId: string) =>
  `/cluster/${encodeURIComponent(nodeId)}/daemons/remoted/tls`;

/* Limits the manager enforces on the token request, shared by the validators
and the texts that state them. */
export const ENROLLMENT_TOKEN_TTL_MAX_DAYS = 3650;
export const ENROLLMENT_TOKEN_TTL_MAX_YEARS = 10;
export const ENROLLMENT_TOKEN_DESCRIPTION_MAX_LENGTH = 256;
export const ENROLLMENT_TOKEN_DESCRIPTION_ALLOWED_SYMBOLS =
  ',*<>!-.+:/()[]\'"|=~#'.split('').join(' ');
