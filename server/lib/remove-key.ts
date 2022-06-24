/*
 * Wazuh app - Useful function for removing sensible keys
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export function cleanKeys(response: any): any {
  // Remove agent key
  if (response.data.data.internal_key) {
    response.data.data.internal_key = '********';
  }

  // Remove cluster key (/com/cluster)
  if (response.data.data.node_type && response.data.data.key) {
    response.data.data.key = '********';
  }

  // Remove cluster key (/manager/configuration)
  if (
    response.data.data.cluster &&
    response.data.data.cluster.node_type &&
    response.data.data.cluster.key
  ) {
    response.data.data.cluster.key = '********';
  }

  // Remove AWS keys
  if (response.data.data.wmodules) {
    response.data.data.wmodules.map(item => {
      if (item['aws-s3']) {
        if (item['aws-s3'].buckets) {
          item['aws-s3'].buckets.map(item => {
            item.access_key = '********';
            item.secret_key = '********';
          });
        }
        if (item['aws-s3'].services) {
          item['aws-s3'].services.map(item => {
            item.access_key = '********';
            item.secret_key = '********';
          });
        }
      }
    });
  }

  // Remove integrations keys
  if (response.data.data.integration) {
    response.data.data.integration.map(item => (item.api_key = '********'));
  }
}
