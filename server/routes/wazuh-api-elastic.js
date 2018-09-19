/*
 * Wazuh app - Module for Wazuh-API-Elastic routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhApiElasticCtrl } from '../controllers';

export function WazuhApiElasticRoutes(server) {
  const ctrl = new WazuhApiElasticCtrl(server);

  // Save the given API into elasticsearch
  server.route({
    method: 'PUT',
    path: '/api/wazuh-api/settings',
    handler(req, reply) {
      return ctrl.saveAPI(req, reply);
    }
  });

  // Update the given API into elasticsearch
  server.route({
    method: 'PUT',
    path: '/api/wazuh-api/update-settings',
    handler(req, reply) {
      return ctrl.updateFullAPI(req, reply);
    }
  });

  // Get Wazuh-API entries list (Multimanager) from elasticsearch index
  server.route({
    method: 'GET',
    path: '/api/wazuh-api/apiEntries',
    handler(req, reply) {
      return ctrl.getAPIEntries(req, reply);
    }
  });

  // Delete Wazuh-API entry (multimanager) from elasticsearch index
  server.route({
    method: 'DELETE',
    path: '/api/wazuh-api/apiEntries/{id}',
    handler(req, reply) {
      return ctrl.deleteAPIEntries(req, reply);
    }
  });

  // Set Wazuh-API as default (multimanager) on elasticsearch index
  server.route({
    method: 'PUT',
    path: '/api/wazuh-api/apiEntries/{id}',
    handler(req, reply) {
      return ctrl.setAPIEntryDefault(req, reply);
    }
  });

  // Update the API hostname
  server.route({
    method: 'PUT',
    path: '/api/wazuh-api/updateApiHostname/{id}',
    handler(req, reply) {
      return ctrl.updateAPIHostname(req, reply);
    }
  });
}
