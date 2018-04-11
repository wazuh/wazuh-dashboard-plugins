const WazuhElastic = require('../controllers/wazuh-elastic');

module.exports = (server, options) => {
    
    const ctrl = new WazuhElastic(server);

    // Get index patterns list
    server.route({ method: 'GET', path: '/get-list', handler: (req,res) => ctrl.getlist(req,res) });

    // Create visualizations specified in 'tab' parameter with the 'timestamp' sufix and applying to 'pattern'
    server.route({ method: 'GET', path: '/api/wazuh-elastic/create-vis/{tab}/{timestamp}/{pattern}', handler: (req,res) => ctrl.createVis(req,res) });

    // Delete visualizations specified in 'tab' parameter
    server.route({ method: 'GET', path: '/api/wazuh-elastic/delete-vis/{timestamp}', handler: (req,res) => ctrl.deleteVis(req,res) });

    // Returns whether a correct template is being applied for the index-pattern
    server.route({ method: 'GET', path: '/api/wazuh-elastic/template/{pattern}', handler: (req,res) => ctrl.getTemplate(req,res) });

    // Returns whether the pattern exists or not
    server.route({ method: 'GET', path: '/api/wazuh-elastic/pattern/{pattern}', handler: (req,res) => ctrl.checkPattern(req,res) });

    // Returns the agent with most alerts
    server.route({ method: 'GET', path: '/api/wazuh-elastic/top/{mode}/{cluster}/{field}', handler: (req,res) => ctrl.getFieldTop(req,res) });

    // Return Wazuh Appsetup info
    server.route({ method: 'GET', path: '/api/wazuh-elastic/setup', handler: (req,res) => ctrl.getSetupInfo(req,res) });

    // Useful to check cookie consistence
    server.route({ method: 'GET', path: '/api/wazuh-elastic/timestamp', handler: (req,res) => ctrl.getTimeStamp(req,res) });
};