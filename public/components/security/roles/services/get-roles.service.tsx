
import IApiResponse from '../../../../react-services/interfaces/api-response.interface';
/*
 * Wazuh app - Get Roles Service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../react-services/wz-request';
import { IRole } from '../interfaces/role.interface';

const GetRolesService = async (): Promise<Array<IRole>> => {
  const response = await WzRequest.apiReq(
    'GET',
    '/security/roles',
    {}
  ) as IApiResponse<IRole>;
  const roles =  response.data?.data?.affected_items || [];
  return roles;
};

export default GetRolesService;