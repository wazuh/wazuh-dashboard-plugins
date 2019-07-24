/*
 * Wazuh app - Module for Wazuh-API-Elastic routes
 * Copyright (C) 2015-2019 Wazuh, Inc.
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

  // Update the API hostname
  server.route({
    method: 'PUT',
    path: '/elastic/api-hostname/{id}',
    handler(req, reply) {
      return ctrl.updateAPIHostname(req, reply);
    }
  });
}
