/*
 * Wazuh app - Get Users Service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { User } from '../types/user.type';
import { WzRequest } from '../../../../react-services/wz-request';
import IApiResponse from '../../../../react-services/interfaces/api-response.interface';

const GetUsersService = async (
  offset = 0,
  limit = 10,
): Promise<{ users: User[]; total: number }> => {
  const response = (await WzRequest.apiReq(
    'GET',
    '/security/users?sort=username',
    {
      params: {
        offset,
        limit,
      },
    },
  )) as IApiResponse<User>;
  const users = ((response.data || {}).data || {}).affected_items || [];
  const total = ((response.data || {}).data || {}).total_affected_items || 0;

  return { users, total };
};

export default GetUsersService;
