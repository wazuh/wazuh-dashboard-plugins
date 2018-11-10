/*
 * Wazuh app - Module for Wazuh-API routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhApiCtrl } from '../controllers';

export function WazuhApiRoutes(server) {
  const ctrl = new WazuhApiCtrl(server);

  // Returns if the wazuh-api configuration is working
  server.route({
    method: 'POST',
    path: '/api/check-stored-api',
    handler(req, reply) {
      return ctrl.checkStoredAPI(req, reply);
    }
  });

  // Check if credentials on POST connect to Wazuh API. Not storing them!
  // Returns if the wazuh-api configuration received in the POST body will work
  server.route({
    method: 'POST',
    path: '/api/check-api',
    handler(req, reply) {
      return ctrl.checkAPI(req, reply);
    }
  });

  // Returns the request result (With error control)
  server.route({
    method: 'POST',
    path: '/api/request',
    handler(req, reply) {
      return ctrl.requestApi(req, reply);
    }
  });

  // Return a PCI requirement description
  server.route({
    method: 'GET',
    path: '/api/pci/{requirement}',
    handler(req, reply) {
      return ctrl.getPciRequirement(req, reply);
    }
  });

  // Return a GDPR requirement description
  server.route({
    method: 'GET',
    path: '/api/gdpr/{requirement}',
    handler(req, reply) {
      return ctrl.getGdprRequirement(req, reply);
    }
  });

  // Force fetch data to be inserted on wazuh-monitoring indices
  server.route({
    method: 'GET',
    path: '/api/monitoring',
    handler(req, reply) {
      return ctrl.fetchAgents(req, reply);
    }
  });

  // Returns data from the Wazuh API on CSV readable format
  server.route({
    method: 'POST',
    path: '/api/csv',
    handler(req, res) {
      return ctrl.csv(req, res);
    }
  });

  // Returns unique fields from the agents such OS, agent version ...
  server.route({
    method: 'GET',
    path: '/api/agents-unique/{api}',
    handler(req, res) {
      return ctrl.getAgentsFieldsUniqueCount(req, res);
    }
  });

}
