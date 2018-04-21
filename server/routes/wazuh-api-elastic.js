import { WazuhApiElastic } from '../controllers/wazuh-api-elastic';

export default (server, options) => {  
    const ctrl = new WazuhApiElastic(server);

    // Save the given API into elasticsearch
    server.route({ method: 'PUT', path: '/api/wazuh-api/settings', handler: (req,res) => ctrl.saveAPI(req,res) });

    // Update the given API into elasticsearch
    server.route({ method: 'PUT', path: '/api/wazuh-api/update-settings', handler: (req,res) => ctrl.updateFullAPI(req,res) });

    // Get Wazuh-API entries list (Multimanager) from elasticsearch index
    server.route({ method: 'GET', path: '/api/wazuh-api/apiEntries', handler: (req,res) => ctrl.getAPIEntries(req,res) });

    // Delete Wazuh-API entry (multimanager) from elasticsearch index
    server.route({ method: 'DELETE', path: '/api/wazuh-api/apiEntries/{id}', handler: (req,res) => ctrl.deleteAPIEntries(req,res) });

    // Set Wazuh-API as default (multimanager) on elasticsearch index
    server.route({ method: 'PUT', path: '/api/wazuh-api/apiEntries/{id}', handler: (req,res) => ctrl.setAPIEntryDefault(req,res) });

    // Toggle extension state: Enable / Disable
    server.route({ method: 'PUT', path: '/api/wazuh-api/extension/toggle/{id}/{extensionName}/{extensionValue}', handler: (req,res) => ctrl.toggleExtension(req,res) });

    // Return extension state list
    server.route({ method: 'GET', path: '/api/wazuh-api/extension', handler: (req,res) => ctrl.getExtensions(req,res) });

    // Update the API hostname
    server.route({ method: 'PUT', path: '/api/wazuh-api/updateApiHostname/{id}', handler: (req,res) => ctrl.updateAPIHostname(req,res) });
};