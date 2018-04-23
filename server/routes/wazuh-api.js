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
import WazuhApi from '../controllers/wazuh-api';

export default (server, options) => {
    const ctrl = new WazuhApi(server);

    // Returns if the wazuh-api configuration is working
    server.route({ method: 'POST', path: '/api/wazuh-api/checkStoredAPI', handler: (req,res) => ctrl.checkStoredAPI(req,res) });

    // Check if credentials on POST connect to Wazuh API. Not storing them!
    // Returns if the wazuh-api configuration received in the POST body will work
    server.route({ method: 'POST', path: '/api/wazuh-api/checkAPI', handler: (req,res) => ctrl.checkAPI(req,res) });

    // Returns the request result (With error control)
    server.route({ method: 'POST', path: '/api/wazuh-api/request', handler: (req,res) => ctrl.requestApi(req,res) });

    // Get Wazuh-API settings from elasticsearch index
    server.route({ method: 'GET', path: '/api/wazuh-api/settings', handler: (req,res) => ctrl.getApiSettings(req,res) });

    // Return a PCI requirement description
    server.route({ method: 'GET', path: '/api/wazuh-api/pci/{requirement}', handler: (req,res) => ctrl.getPciRequirement(req,res) });

    // Write in debug log
    server.route({ method: 'POST', path: '/api/wazuh/errlog', handler: (req,res) => ctrl.postErrorLog(req,res) });

    // COMMENT HERE
    server.route({ method: 'GET', path: '/api/wazuh-api/fetchAgents', handler: (req,res) => ctrl.fetchAgents(req,res) });

    // COMMENT HERE
    server.route({ method: 'GET', path: '/api/wazuh-api/configuration', handler: (req,res) => ctrl.getConfigurationFile(req,res) });

    // COMMENT HERE
    server.route({ method: 'POST',path: '/api/wazuh-api/wlogin', handler: (req,res) => ctrl.login(req,res) });
};
