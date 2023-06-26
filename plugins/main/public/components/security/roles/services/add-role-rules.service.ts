/*
 * Wazuh app - Add Role Rules Service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { Role } from '../types/role.type';
import { WzRequest } from '../../../../react-services/wz-request';
import IApiResponse from '../../../../react-services/interfaces/api-response.interface';

const AddRoleRulesService = async (roleId: number, rules: number[]): Promise<Role> => {
  const response = (await WzRequest.apiReq(
    'POST',
    `/security/roles/${roleId}/rules?rule_ids=${rules.join(',')}`,
    {}
  )) as IApiResponse<Role>;
  const roles = ((response.data || {}).data || {}).affected_items || [{}];
  return roles[0];
};

export default AddRoleRulesService;
