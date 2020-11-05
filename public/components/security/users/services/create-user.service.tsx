
/*
 * Wazuh app - Create User Service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ICreateUser, IUser } from '../interfaces/user.interface';
import { WzRequest } from '../../../../react-services/wz-request';
import IApiResponse from '../../../../react-services/interfaces/api-response.interface';

const CreateUserService = async (user: ICreateUser): Promise<IUser> => {
  const response = await WzRequest.apiReq(
    'POST',
    '/security/users',
    user
  ) as IApiResponse<IUser>;
  const users = response.data?.data?.affected_items || [{}];
  return users[0];
};

export default CreateUserService;