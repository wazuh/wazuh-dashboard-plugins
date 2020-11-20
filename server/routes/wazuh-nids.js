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
import { WazuhNidsCtrl } from '../controllers';

export async function WazuhNidsRoutes(server) {
  const ctrl = new WazuhNidsCtrl(server);

  // Get rulesets nodes
  await server.route({    
    method: 'GET',
    path: '/nids/rulesets',
    handler(req, reply) {
      return ctrl.getRulesets(req, reply);
    }
  });

  // Get nids nodes
  await server.route({    
    method: 'GET',
    path: '/nids/nodes',
    handler(req, reply) {
      return ctrl.getNodes(req, reply);
    }
  });

  // Get nids nodes
  await server.route({    
    method: 'GET',
    path: '/nids/interfaces',
    handler(req, reply) {
      return ctrl.getInterfaces(req, reply);
    }
  });

  // Get nids tags
  await server.route({    
    method: 'GET',
    path: '/nids/tags',
    handler(req, reply) {
      return ctrl.getTags(req, reply);
    }
  });

  // Get node orgs
  await server.route({    
    method: 'GET',
    path: '/nids/orgs',
    handler(req, reply) {
      return ctrl.getOrgs(req, reply);
    }
  });

  // Delete specific node
  server.route({
    method: 'PUT',
    path: '/nids/node/delete',
    handler(req, reply) {      
      return ctrl.deleteNode(req, reply);
    }
  });

  // Delete specific node
  server.route({
    method: 'GET',
    path: '/nids/groups',
    handler(req, reply) {      
      return ctrl.getGroups(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'PUT',
    path: '/nids/node/editNode',
    handler(req, reply) {      
      return ctrl.editNode(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'PUT',
    path: '/nids/node/updateService',
    handler(req, reply) {      
      return ctrl.updateService(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'PUT',
    path: '/nids/node/LaunchZeekMainConf',
    handler(req, reply) {      
      return ctrl.LaunchZeekMainConf(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'PUT',
    path: '/nids/node/changeServiceStatus',
    handler(req, reply) {      
      return ctrl.changeServiceStatus(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'PUT',
    path: '/nids/zeek',
    handler(req, reply) {      
      return ctrl.pingZeek(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'PUT',
    path: '/nids/node/PingPluginsNode',
    handler(req, reply) {      
      return ctrl.getNodePlugins(req, reply);
    }
  });

  // Edit specific node
  server.route({
    method: 'POST',
    path: '/nids/node/addService',
    handler(req, reply) {      
      return ctrl.addService(req, reply);
    }
  });

  // Add new node
  server.route({
    method: 'POST',
    path: '/nids/node/enroll',
    handler(req, reply) {      
      return ctrl.enrollNode(req, reply);
    }
  });

  // Delete specific service
  server.route({
    method: 'DELETE',
    path: '/nids/node/deleteService',
    handler(req, reply) {      
      return ctrl.deleteService(req, reply);
    }
  });

  // Delete specific service
  server.route({
    method: 'PUT',
    path: '/nids/node/syncRuleset',
    handler(req, reply) {      
      return ctrl.syncRuleset(req, reply);
    }
  });

}