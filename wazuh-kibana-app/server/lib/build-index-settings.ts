/*
 * Wazuh app - Elastic wrapper helper
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Returns well formatted object to set shards and replicas when creating/updating indices.
 * @param {*} file Parsed content from wazuh.yml file
 * @param {string} indexName Target index name
 * @param {number} defaultShards Default shards value if missing in configuration
 * @param {number} defaulReplicas Default replicas value if missing in configuration
 */
export function buildIndexSettings(
  file: any,
  indexName: string,
  defaultShards: number = 1,
  defaulReplicas: number = 0
) {
  if (indexName) {
    const shards =
      file && typeof file[`${indexName}.shards`] !== 'undefined'
        ? file[`${indexName}.shards`]
        : defaultShards;

    const replicas =
      file && typeof file[`${indexName}.replicas`] !== 'undefined'
        ? file[`${indexName}.replicas`]
        : defaulReplicas;

    const configuration = {
      settings: {
        index: {
          number_of_shards: shards,
          number_of_replicas: replicas
        }
      }
    };

    return configuration;
  }

  return null;
}
