/*
 * Wazuh app - Makes null the region maps (temporary fix in order to make it work)
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getAngularModule } from '../kibana-services';

const app = getAngularModule();

app
  .service('regionmapsConfig', function() {
    return {
      // Intended noop function and empty array
      noop() {},
      layers: []
    };
  })
  .service('mapConfig', function() {
    return {
      // Intended noop function
      noop() {}
    };
  })
  .service('tilemapsConfig', function() {
    return {
      // Intended noop function and false properties
      noop() {},
      origin: 'self_hosted',
      deprecated: {
        config: {
          options: false,
          url:
            'https://tiles.maps.elastic.co/v2/default/{z}/{x}/{y}.png?elastic_tile_service_tos=agree&my_app_name=kibana&my_app_version=6.7.1'
        }
      }
    };
  });
