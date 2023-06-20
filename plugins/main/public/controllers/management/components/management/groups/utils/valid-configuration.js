/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../../../react-services/wz-request';

const validateConfigAfterSent = async (node = false) => {
  try {
    const clusterStatus = await WzRequest.apiReq('GET', `/cluster/status`, {});

    const clusterData = ((clusterStatus || {}).data || {}).data || {};
    const isCluster =
      clusterData.enabled === 'yes' && clusterData.running === 'yes';

    let validation = false;
    if (node && isCluster) {
      validation = await WzRequest.apiReq(
        'GET',
        `/cluster/${node}/configuration/validation`,
        {}
      );
    } else {
      validation = isCluster
        ? await WzRequest.apiReq('GET', `/cluster/configuration/validation`, {})
        : await WzRequest.apiReq(
            'GET',
            `/manager/configuration/validation`,
            {}
          );
    }
    const data = ((validation || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      throw data;
    }
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

export default validateConfigAfterSent;
