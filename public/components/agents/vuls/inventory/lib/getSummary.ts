/*
 * Wazuh app - Agent vulnerabilities components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WzRequest } from '../../../../../react-services/wz-request';

export async function getSummary(agentId, filters={}) {

  const filter = {
    ...filters,
  };
  
  const result = await WzRequest.apiReq('GET', `/vulnerability/${agentId}/summary`, { params: filter });
  const summary = (((result || {}).data || {}).data || {}).affected_items || {};
  return summary;
}
