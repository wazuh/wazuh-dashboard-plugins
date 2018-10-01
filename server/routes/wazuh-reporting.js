/*
 * Wazuh app - Module for Wazuh reporting routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhReportingCtrl } from '../controllers';

export function WazuhReportingRoutes(server) {
  const ctrl = new WazuhReportingCtrl(server);

  // Builds a PDF report from multiple PNG images
  server.route({
    method: 'POST',
    path: '/reports',
    handler(req, res) {
      return ctrl.report(req, res);
    }
  });

  // Fetch specific report
  server.route({
    method: 'GET',
    path: '/reports/{name}',
    handler(req, res) {
      return ctrl.getReportByName(req, res);
    }
  });

  // Delete specific report
  server.route({
    method: 'DELETE',
    path: '/reports/{name}',
    handler(req, res) {
      return ctrl.deleteReportByName(req, res);
    }
  });

  // Fetch the reports list
  server.route({
    method: 'GET',
    path: '/reports',
    handler(req, res) {
      return ctrl.getReports(req, res);
    }
  });
}
