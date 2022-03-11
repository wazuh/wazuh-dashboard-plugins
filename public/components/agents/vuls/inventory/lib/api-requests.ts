/*
 * Wazuh app - Agent vulnerabilities requests
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

export async function getAggregation(agentId, field, limit = null) {
  const result = await WzRequest.apiReq('GET', `/vulnerability/${agentId}/summary/${field}`, limit ? {params: {limit}} : {});
  return result?.data?.data;
}

export async function getFilterValues(field, value, agentId, filters = {}, format = (item) => item) {

  const filter = {
    ...filters,
    distinct: true,
    select: field,
    limit: 30,
  };
  if (value) {
    filter['search'] = value;
  }
  const result = await WzRequest.apiReq('GET', `/vulnerability/${agentId}`, { params: filter });
  return (((result || {}).data || {}).data || {}).affected_items.map((item) => { return format(item[field]) });
}

export async function getSummary(agentId = '000') {
  let summary = [
    { title: 50, description: 'Critical', titleColor: 'danger' },
    { title: 25, description: 'High', titleColor: '#FEC514' },
    { title: 40, description: 'Medium', titleColor: 'primary' },
    { title: 17, description: 'Low', titleColor: 'subdued' },
  ];
  try {
    const result = await WzRequest.apiReq('GET', `/vulnerability/${agentId}/summary`, {});
    summary = (((result || {}).data || {}).data || {}).affected_items || {};
  } catch (e) {

  }
  return summary;
}

export async function getLastScan(agentId = '000') {
  const response = await WzRequest.apiReq(
    'GET',
    `/vulnerability/${agentId}/last_scan`,
    {}
  );
  return ((response.data || {}).data || {}).affected_items[0] || {};
}
