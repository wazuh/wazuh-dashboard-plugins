/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WzRequest } from '../../../../../react-services/wz-request';

export async function getFilterValues(field, value) {

  const filter = {
    distinct: true,
    select: field,
    limit: 30,
  };
  if (value) {
    filter['search'] = value;
  }
  // TODO: Get the agent from paramentes
  const result = await WzRequest.apiReq('GET', '/syscheck/001', filter)
  return (((result || {}).data || {}).data || {}).items.map((item) => {return item[field]});
}