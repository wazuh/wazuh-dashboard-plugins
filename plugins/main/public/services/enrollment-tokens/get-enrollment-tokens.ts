/*
 * Wazuh app - Get Enrollment Tokens Service
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
import { EnrollmentTokenSummary } from './types';

/**
 * List the enrollment tokens the manager has minted.
 *
 * Neither the token text nor its credential is part of the listing: a token
 * that was not kept when it was minted cannot be recovered from here.
 *
 * The signature matches what `usePagination` calls a fetch function with, so
 * the table drives the offset, the limit and the sort.
 */
export const getEnrollmentTokens = async (
  offset = 0,
  limit = 10,
  sort?: string,
): Promise<{ tokens: EnrollmentTokenSummary[]; total: number }> => {
  const response = (await WzRequest.apiReq('GET', ENROLLMENT_TOKENS_ENDPOINT, {
    params: {
      offset,
      limit,
      ...(sort ? { sort } : {}),
    },
  })) as IApiResponse<EnrollmentTokenSummary>;
  const tokens = response?.data?.data?.affected_items ?? [];
  const total = response?.data?.data?.total_affected_items ?? 0;

  return { tokens, total };
};
