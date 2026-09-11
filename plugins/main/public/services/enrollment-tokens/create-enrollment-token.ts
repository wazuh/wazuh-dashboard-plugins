/*
 * Wazuh app - Create Enrollment Token Service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../react-services/wz-request';
import { ENROLLMENT_TOKENS_ENDPOINT } from './constants';
import { EnrollmentTokenRequest, MintedEnrollmentToken } from './types';

const isEmpty = (value?: string | number) =>
  value === undefined || value === null || String(value).trim().length === 0;

/**
 * Build the request body, leaving out every optional the operator did not fill
 * so the manager applies its own defaults instead of a value invented here.
 */
export const buildEnrollmentTokenRequestBody = (
  parameters: EnrollmentTokenRequest,
) => {
  const {
    address,
    port,
    prefix,
    ttl,
    maxUses,
    description,
    embedCa,
    noCredential,
  } = parameters;
  const body: Record<string, string | number | boolean> = {
    address: address.trim(),
  };

  if (!isEmpty(port)) {
    body.port = Number.parseInt(String(port), 10);
  }
  if (!isEmpty(prefix)) {
    body.prefix = String(prefix).trim();
  }
  if (!isEmpty(ttl)) {
    body.ttl = String(ttl).trim();
  }
  if (!isEmpty(maxUses)) {
    // eslint-disable-next-line camelcase -- the Wazuh Server API body uses snake_case
    body.max_uses = Number.parseInt(String(maxUses), 10);
  }
  if (!isEmpty(description)) {
    body.description = String(description).trim();
  }
  /* Both flags default to false on the manager, so they are only sent when
  they are turned on: an explicit `false` would say the same thing while making
  the request depend on a default this code would then have to track. */
  if (embedCa) {
    // eslint-disable-next-line camelcase -- the Wazuh Server API body uses snake_case
    body.embed_ca = true;
  }
  if (noCredential) {
    // eslint-disable-next-line camelcase -- the Wazuh Server API body uses snake_case
    body.no_credential = true;
  }

  return body;
};

/**
 * Mint an enrollment token on the master node.
 *
 * The manager validates the address against the names in its listener
 * certificate and refuses one it does not cover, so no equivalent check is done
 * here: a second, locally computed rule would drift from the one the manager
 * actually enforces. The rejection reaches the caller as the manager wrote it.
 */
export const createEnrollmentToken = async (
  parameters: EnrollmentTokenRequest,
): Promise<MintedEnrollmentToken> => {
  const response = await WzRequest.apiReq(
    'POST',
    ENROLLMENT_TOKENS_ENDPOINT,
    buildEnrollmentTokenRequestBody(parameters),
  );
  /* The mint answers with the token itself rather than with the
  `affected_items` envelope the rest of the collection uses. */
  const enrollmentToken = response?.data?.data as unknown as
    | MintedEnrollmentToken
    | undefined;

  if (!enrollmentToken?.token) {
    throw new Error(
      response?.data?.message ||
        'The server API did not return an enrollment token.',
    );
  }

  return enrollmentToken;
};
