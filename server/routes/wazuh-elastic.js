/*
 * Wazuh app - Module for Wazuh-Elastic routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhElasticCtrl } from '../controllers';

export function WazuhElasticRouter(server) {
  const ctrl = new WazuhElasticCtrl(server);

  // Get index patterns list
  server.route({
    method: 'GET',
    path: '/get-list',
    handler(req, res) {
      return ctrl.getlist(req, res);
    }
  });

  // Refresh known fields for specific index pattern
  server.route({
    method: 'GET',
    path: '/refresh-fields/{pattern}',
    handler(req, res) {
      return ctrl.refreshIndex(req, res);
    }
  });

  // Create visualizations specified in 'tab' parameter and applying to 'pattern'
  server.route({
    method: 'GET',
    path: '/api/wazuh-elastic/create-vis/{tab}/{pattern}',
    handler(req, res) {
      return ctrl.createVis(req, res);
    }
  });
  server.route({
    method: 'POST',
    path: '/api/wazuh-elastic/create-vis/{tab}/{pattern}',
    handler(req, res) {
      return ctrl.createClusterVis(req, res);
    }
  });

  // Returns whether a correct template is being applied for the index-pattern
  server.route({
    method: 'GET',
    path: '/api/wazuh-elastic/template/{pattern}',
    handler(req, res) {
      return ctrl.getTemplate(req, res);
    }
  });

  // Returns whether the pattern exists or not
  server.route({
    method: 'GET',
    path: '/api/wazuh-elastic/pattern/{pattern}',
    handler(req, res) {
      return ctrl.checkPattern(req, res);
    }
  });

  // Returns the agent with most alerts
  server.route({
    method: 'GET',
    path: '/api/wazuh-elastic/top/{mode}/{cluster}/{field}/{pattern}',
    handler(req, res) {
      return ctrl.getFieldTop(req, res);
    }
  });

  // Return Wazuh Appsetup info
  server.route({
    method: 'GET',
    path: '/api/wazuh-elastic/setup',
    handler(req, res) {
      return ctrl.getSetupInfo(req, res);
    }
  });

  // Useful to check cookie consistence
  server.route({
    method: 'GET',
    path: '/api/wazuh-elastic/timestamp',
    handler(req, res) {
      return ctrl.getTimeStamp(req, res);
    }
  });
}
