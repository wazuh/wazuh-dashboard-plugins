/*
 * Wazuh app - Revoke and purge Enrollment Tokens Services
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
import IApiResponse from '../../react-services/interfaces/api-response.interface';
import { ENROLLMENT_TOKENS_ENDPOINT } from './constants';
import { EnrollmentTokenPurgeStatus } from './types';

/* The API answers a partial failure with a 200 whose `failed_items` carry the
reason, so the response has to be read rather than only awaited: without this
a token that was not revoked would be reported to the operator as revoked. */
const affectedItemsOrThrow = (
  response: IApiResponse<string>,
  fallbackMessage: string,
): string[] => {
  const data = response?.data?.data;
  const failedItem = data?.failed_items?.[0];

  if (failedItem) {
    throw new Error(failedItem.error?.message || fallbackMessage);
  }

  return data?.affected_items ?? [];
};

/**
 * Revoke one enrollment token.
 *
 * A revoked token enrolls nobody from that moment on and stays in the listing
 * with `revoked: true`; it is `purgeEnrollmentTokens` that removes rows from
 * the store. Revoking an already revoked token succeeds again.
 */
export const revokeEnrollmentToken = async (
  tokenId: string,
): Promise<string[]> => {
  const response = (await WzRequest.apiReq(
    'DELETE',
    `${ENROLLMENT_TOKENS_ENDPOINT}/${tokenId}`,
    {},
  )) as IApiResponse<string>;

  return affectedItemsOrThrow(
    response,
    'The enrollment token could not be revoked.',
  );
};

/**
 * Remove enrollment tokens from the manager's store.
 *
 * `dead` removes only the tokens that can no longer authorise an enrollment --
 * revoked, expired or out of uses -- and never touches a usable one. `all`
 * empties the store, the tokens still in use included.
 */
export const purgeEnrollmentTokens = async (
  status: EnrollmentTokenPurgeStatus = 'dead',
): Promise<string[]> => {
  const response = (await WzRequest.apiReq(
    'DELETE',
    ENROLLMENT_TOKENS_ENDPOINT,
    {
      params: { status },
    },
  )) as IApiResponse<string>;

  return affectedItemsOrThrow(
    response,
    'The enrollment tokens could not be purged.',
  );
};
