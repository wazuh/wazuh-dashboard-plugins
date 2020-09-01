/*
 * Wazuh app - Module for Wazuh-API routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
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

  server.route({
    method: 'POST',
    path: '/api/login',
    handler(req, reply) {
      return ctrl.getToken(req, reply);
    }
  })

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

  // Return a NIST 800-53 requirement description
  server.route({
    method: 'GET',
    path: '/api/nist/{requirement}',
    handler(req, reply) {
      return ctrl.getNistRequirement(req, reply);
    }
  });

  // Return a TSC requirement description
  server.route({
    method: 'GET',
    path: '/api/tsc/{requirement}',
    handler(req, reply) {
      return ctrl.getTSCRequirement(req, reply);
    }
  });

  // Return a HIPAA requirement description
  server.route({
    method: 'GET',
    path: '/api/hipaa/{requirement}',
    handler(req, reply) {
      return ctrl.getHipaaRequirement(req, reply);
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

  // Returns a route list used by the Dev Tools
  server.route({
    method: 'GET',
    path: '/api/routes',
    handler(req, res) {
      return ctrl.getRequestList(req, res);
    }
  });

  // Useful to check cookie consistence
  server.route({
    method: 'GET',
    path: '/api/timestamp',
    handler(req, res) {
      return ctrl.getTimeStamp(req, res);
    }
  });

  server.route({
    method: 'POST',
    path: '/api/extensions',
    handler(req, res) {
      return ctrl.setExtensions(req, res);
    }
  });

  server.route({
    method: 'GET',
    path: '/api/extensions/{id}',
    handler(req, res) {
      return ctrl.getExtensions(req, res);
    }
  });

  // Return Wazuh Appsetup info
  server.route({
    method: 'GET',
    path: '/api/setup',
    handler(req, res) {
      return ctrl.getSetupInfo(req, res);
    }
  });

  // Return basic information of syscollector for given agent
  server.route({
    method: 'GET',
    path: '/api/syscollector/{agent}',
    handler(req, res) {
      return ctrl.getSyscollector(req, res);
    }
  });
}
