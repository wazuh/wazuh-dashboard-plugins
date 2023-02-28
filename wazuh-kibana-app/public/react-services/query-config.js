/*
 * Wazuh app - Query config on-demand
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from './wz-request';
import { getErrorOrchestrator } from './common-services';
import { AppState } from './app-state';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';

export const queryConfig = async (agentId, sections, node = false) => {
  try {
    if (
      !agentId ||
      typeof agentId !== 'string' ||
      !sections ||
      !sections.length ||
      typeof sections !== 'object' ||
      !Array.isArray(sections)
    ) {
      throw new Error('Invalid parameters');
    }

    const result = {};
    await Promise.all(sections.map(async(section)=> {
      const { component, configuration } = section;
      if (
        !component ||
        typeof component !== 'string' ||
        !configuration ||
        typeof configuration !== 'string'
      ) {
        throw new Error('Invalid section');
      }
      try {
        const url = node
          ? `/cluster/${node}/configuration/${component}/${configuration}`
          : !node
            && agentId === '000'
            ? `/manager/configuration/${component}/${configuration}`
            : `/agents/${agentId}/configuration/${component}/${configuration}`;

        const partialResult = await WzRequest.apiReq('GET', url, {});
        result[`${component}-${configuration}`] = partialResult.data.data;
      } catch (error) {
        const options = {
          context: `${AppState.name}.queryConfig`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          display: false,
          error: {
            error: error,
            message: error.message || error,
            title: `Fetch Configuration`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }));
    return result;
  } catch (error) {
    const options = {
      context: `${AppState.name}.queryConfig`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      display: false,
      error: {
        error: error,
        message: error.message || error,
        title: `Error getting the query config`,
      },
    };

    getErrorOrchestrator().handleError(options);
  }
}
