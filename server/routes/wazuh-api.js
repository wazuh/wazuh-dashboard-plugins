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
import { WazuhApi } from '../controllers';

export default (server, options) => {
    const ctrl = new WazuhApi(server);

    // Returns if the wazuh-api configuration is working
    server.route({ method: 'POST', path: '/api/wazuh-api/checkStoredAPI', handler: (req, reply) => ctrl.checkStoredAPI(req, reply) });

    // Check if credentials on POST connect to Wazuh API. Not storing them!
    // Returns if the wazuh-api configuration received in the POST body will work
    server.route({ method: 'POST', path: '/api/wazuh-api/checkAPI', handler: (req, reply) => ctrl.checkAPI(req, reply) });

    // Returns the request result (With error control)
    server.route({ method: 'POST', path: '/api/wazuh-api/request', handler: (req, reply) => ctrl.requestApi(req, reply) });

    // Return a PCI requirement description
    server.route({ method: 'GET', path: '/api/wazuh-api/pci/{requirement}', handler: (req, reply) => ctrl.getPciRequirement(req, reply) });

    // Return a GDPR requirement description
    server.route({ method: 'GET', path: '/api/wazuh-api/gdpr/{requirement}', handler: (req, reply) => ctrl.getGdprRequirement(req, reply) });

    // Force fetch data to be inserted on wazuh-monitoring indices
    server.route({ method: 'GET', path: '/api/wazuh-api/fetchAgents', handler: (req, reply) => ctrl.fetchAgents(req, reply) });

    // Returns the config.yml file parsed
    server.route({ method: 'GET', path: '/api/wazuh-api/configuration', handler: (req, reply) => ctrl.getConfigurationFile(req, reply) });

    // Experimental feature to simulate a login system
    server.route({ method: 'POST',path: '/api/wazuh-api/wlogin', handler: (req, reply) => ctrl.login(req, reply) });

    // Returns data from the Wazuh API on CSV readable format
    server.route({ method: 'POST', path: '/api/wazuh-api/csv', handler: (req,res) => ctrl.csv(req,res)})

    // Builds a PDF report from multiple PNG images
    server.route({ method: 'POST', path: '/api/wazuh-api/report', handler: (req,res) => ctrl.report(req,res)});

    // Fetch specific report
    server.route({ method: 'GET', path: '/api/wazuh-api/report/{name}', handler: (req,res) => ctrl.getReportByName(req,res)});

    // Delete specific report
    server.route({ method: 'DELETE', path: '/api/wazuh-api/report/{name}', handler: (req,res) => ctrl.deleteReportByName(req,res)});

    // Fetch the reports list
    server.route({ method: 'GET', path: '/api/wazuh-api/reports', handler: (req,res) => ctrl.getReports(req,res)});

    // Returns total RAM available from the current machine where Kibana is being executed
    server.route({ method: 'GET', path: '/api/wazuh-api/ram', handler: (req,res) => ctrl.totalRam(req,res)})

    // Returns unique fields from the agents such OS, agent version ...
    server.route({ method: 'GET', path: '/api/wazuh-api/agents-unique/{api}', handler: (req,res) => ctrl.getAgentsFieldsUniqueCount(req,res)});
};
