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
 * The first three arguments are what `usePagination` calls a fetch function
 * with, so the table drives the offset, the limit and the sort. `search` is
 * bound by the caller.
 *
 * `search` is the API's own free-text filter: it keeps the tokens containing
 * the string and is applied by the manager, so it filters the whole collection
 * rather than the page in hand. It is not limited to one field -- an id or an
 * address matches it as well as a description -- because the collection
 * exposes no per-field substring filter: `q` compares whole values only, and
 * its `~` operator answers 500 on this resource.
 */
export const getEnrollmentTokens = async (
  offset = 0,
  limit = 10,
  sort?: string,
  search?: string,
): Promise<{ tokens: EnrollmentTokenSummary[]; total: number }> => {
  const searchTerm = search?.trim();
  const response = (await WzRequest.apiReq('GET', ENROLLMENT_TOKENS_ENDPOINT, {
    params: {
      offset,
      limit,
      ...(sort ? { sort } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
    },
  })) as IApiResponse<EnrollmentTokenSummary>;
  const tokens = response?.data?.data?.affected_items ?? [];
  const total = response?.data?.data?.total_affected_items ?? 0;

  return { tokens, total };
};
