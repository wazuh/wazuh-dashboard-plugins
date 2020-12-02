/*
 * Wazuh app - Module for Wazuh utils routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
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

  // Returns the wazuh.yml file parsed
  server.route({
    method: 'GET',
    path: '/utils/configuration',
    handler(req, reply) {
      return ctrl.getConfigurationFile(req, reply);
    }
  });

  // Returns the wazuh.yml file in raw
  server.route({
    method: 'PUT',
    path: '/utils/configuration',
    handler(req, reply) {
      return ctrl.updateConfigurationFile(req, reply);
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
