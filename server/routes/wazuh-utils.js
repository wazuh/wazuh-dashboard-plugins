/*
 * Wazuh app - Module for Wazuh utils routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhUtilsCtrl } from '../controllers';

export function WazuhUtilsRoutes(server) {
  const ctrl = new WazuhUtilsCtrl();

  // Returns the config.yml file parsed
  server.route({
    method: 'GET',
    path: '/utils/configuration',
    handler(req, reply) {
      return ctrl.getConfigurationFile(req, reply);
    }
  });

  // Returns total RAM available from the current machine where Kibana is being executed
  server.route({
    method: 'GET',
    path: '/utils/memory',
    handler(req, res) {
      return ctrl.totalRam(req, res);
    }
  });

  // Returns Wazuh app logs ...
  server.route({
    method: 'GET',
    path: '/utils/logs',
    handler(req, res) {
      return ctrl.getAppLogs(req, res);
    }
  });
}
