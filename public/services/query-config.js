/*
 * Wazuh app - Query config on-demand
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Returns applied configuration for specific agent and specific section
 * @param {string} agentId Agent ID
 * @param {Array<object>} sections Array that includes sections to be fetched
 * @param {object} apiReq API request service reference
 */
export async function queryConfig(agentId, sections, apiReq, errorHandler) {
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
    for (const section of sections) {
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
        const partialResult = await apiReq.request(
          'GET',
          `/agents/${agentId}/config/${component}/${configuration}`,
          {}
        );
        result[`${component}-${configuration}`] = partialResult.data.data;
      } catch (error) {
        result[`${component}-${configuration}`] = errorHandler.handle(error, 'Fetch configuration', false, true);
      }
    }
    return result;
  } catch (error) {
    return Promise.reject(error);
  }
}
