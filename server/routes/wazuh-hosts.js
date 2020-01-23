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
import { WazuhHostsCtrl } from '../controllers/wazuh-hosts';

export function WazuhHostsRoutes(server) {
  const ctrl = new WazuhHostsCtrl(server);

  // Get Wazuh-API entries list (Multimanager) from elasticsearch index
  server.route({
    method: 'GET',
    path: '/hosts/apis',
    handler(req, reply) {
      return ctrl.getHostsEntries(req, reply);
    }
  });

  // Updates the cluster-info or manager-info
  server.route({
    method: 'PUT',
    path: '/hosts/update-hostname/{id}',
    handler(req, reply) {
      return ctrl.updateClusterInfo(req, reply);
    }
  });

  // Checks the orphan hosts in the registry in order to delete them
  server.route({
    method: 'POST',
    path: '/hosts/remove-orphan-entries',
    handler(req, reply) {
      return ctrl.removeOrphanEntries(req, reply);
    }
  });
}
