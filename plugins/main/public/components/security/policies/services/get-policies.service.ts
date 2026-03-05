/*
 * Wazuh app - Get Policies Service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../react-services/wz-request';
import IApiResponse from '../../../../react-services/interfaces/api-response.interface';

interface Policy {
  id: string;
  name: string;
  policy: {
    effect: string;
    actions: string[];
    resources: string[];
  };
}

interface GetPoliciesResult {
  data: Policy[];
  total: number;
}

const GetPoliciesService = async (
  offset = 0,
  limit = 10,
): Promise<GetPoliciesResult> => {
  const response = (await WzRequest.apiReq('GET', '/security/policies', {
    params: {
      offset,
      limit,
    },
  })) as IApiResponse<Policy>;
  const data = ((response.data || {}).data || {}).affected_items || [];
  const total = ((response.data || {}).data || {}).total_affected_items || 0;
  return { data, total };
};

export default GetPoliciesService;
