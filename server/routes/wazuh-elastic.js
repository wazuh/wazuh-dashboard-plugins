/*
 * Wazuh app - Module for Wazuh-Elastic routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
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

  // Get current space
  server.route({
    method: 'GET',
    path: '/elastic/current-space',
    handler(req, res) {
      return ctrl.getCurrentSpace(req, res);
    }
  });

  // Get current user
  server.route({
    method: 'GET',
    path: '/elastic/security/current-user',
    handler(req, res) {
      return ctrl.getCurrentUser(req, res);
    }
  });  

  // Get roles of an user
  server.route({
    method: 'GET',
    path: '/elastic/security/roles/{user}',
    handler(req, res) {
      return ctrl.getRoles(req, res);
    }
  });
    
  // Get current security platform
  server.route({
    method: 'GET',
    path: '/elastic/security/current-platform',
    handler(req, res) {
      return ctrl.getCurrentPlatform(req, res);
    }
  });  

  // Get index patterns list
  server.route({
    method: 'GET',
    path: '/elastic/index-patterns',
    handler(req, res) {
      return ctrl.getlist(req, res);
    }
  });

  // Refresh known fields for specific index pattern
  server.route({
    method: 'GET',
    path: '/elastic/known-fields/{pattern}',
    handler(req, res) {
      return ctrl.refreshIndex(req, res);
    }
  });

  // Create visualizations specified in 'tab' parameter and applying to 'pattern'
  server.route({
    method: 'GET',
    path: '/elastic/visualizations/{tab}/{pattern}',
    handler(req, res) {
      return ctrl.createVis(req, res);
    }
  });
  server.route({
    method: 'POST',
    path: '/elastic/visualizations/{tab}/{pattern}',
    handler(req, res) {
      return ctrl.createClusterVis(req, res);
    }
  });

  // Returns whether a correct template is being applied for the index-pattern
  server.route({
    method: 'GET',
    path: '/elastic/template/{pattern}',
    handler(req, res) {
      return ctrl.getTemplate(req, res);
    }
  });

  // Returns whether the pattern exists or not
  server.route({
    method: 'GET',
    path: '/elastic/index-patterns/{pattern}',
    handler(req, res) {
      return ctrl.checkPattern(req, res);
    }
  });

  // Returns the agent with most alerts
  server.route({
    method: 'GET',
    path: '/elastic/top/{mode}/{cluster}/{field}/{pattern}',
    handler(req, res) {
      return ctrl.getFieldTop(req, res);
    }
  });

  // Fetch alerts directly from Elasticsearch
  server.route({
    method: 'POST',
    path: '/elastic/alerts',
    handler(req, res) {
      return ctrl.alerts(req, res);
    }
  });
  // Check if there is some sample alerts index
  server.route({
    method: 'GET',
    path: '/elastic/samplealerts',
    handler(req, res) {
      return ctrl.haveSampleAlerts(req, res);
    }
  });
  // Check if there is sample alerts index created of category
  server.route({
    method: 'GET',
    path: '/elastic/samplealerts/{category}',
    handler(req, res) {
      return ctrl.haveSampleAlertsOfCategory(req, res);
    }
  });
  // Create sample alert index
  server.route({
    method: 'POST',
    path: '/elastic/samplealerts/{category}',
    handler(req, res) {
      return ctrl.createSampleAlerts(req, res);
    }
  });
  // Delete sample alert index by category
  server.route({
    method: 'DELETE',
    path: '/elastic/samplealerts/{category}',
    handler(req, res) {
      return ctrl.deleteSampleAlerts(req, res);
    }
  });
  // Fetch alerts directly from Elasticsearch with esQuery object
  server.route({
    method: 'POST',
    path: '/elastic/esAlerts',
    handler(req, res) {
      return ctrl.esAlerts(req, res);
    }
  });
  // Check if there are indices for Statistics
  server.route({
    method: 'GET',
    path: '/elastic/statistics',
    handler(req, res) {
      return ctrl.existStatisticsIndices(req, res);
    }
  });
}
