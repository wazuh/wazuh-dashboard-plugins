/*
 * Wazuh app - Update Rule Service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { UpdateRule, Rule } from '../types/rule.type';
import { WzRequest } from '../../../../react-services/wz-request';
import IApiResponse from '../../../../react-services/interfaces/api-response.interface';

const UpdateRuleService = async (ruleId: number, rule: UpdateRule): Promise<Rule> => {
  const response = (await WzRequest.apiReq(
    'PUT',
    `/security/rules/${ruleId}`,
    rule
  )) as IApiResponse<Rule>;
  const rules = ((response.data || {}).data || {}).affected_items || [{}];
  return rules[0];
};

export default UpdateRuleService;
