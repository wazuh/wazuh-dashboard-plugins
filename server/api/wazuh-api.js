module.exports = function (server, options) {
	// Require some libraries
	const fs = require('fs');
	const path = require('path');
	const needle = require('needle');

    // External references 
	var fetchAgentsExternal = require(path.resolve(__dirname, "../monitoring.js"));
    var getConfig = require(path.resolve(__dirname, "./wazuh-elastic.js"));

    // Colors for console logging 
	var colors = require('ansicolors');
	var blueWazuh = colors.blue('wazuh');

    // Variables
    const pciRequirementsFile = '../integration_files/pci_requirements.json';
	var package_info = {};

    // Read Wazuh app package file
    try {
        package_info = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
    } catch (e) {
        server.log([blueWazuh, 'initialize', 'error'], 'Could not read the Wazuh package file.');
    };

    var checkStoredAPI = function (req, reply) {
        // Get config from elasticsearch
        getConfig(function (wapi_config) {
            if (wapi_config.error_code > 1) {
                // Can not connect to elasticsearch
                reply({ 'statusCode': 200, 'error': '1', 'data': 'no_elasticsearch' });
                return;
            } else if (wapi_config.error_code > 0) {
                // Credentials not found
                reply({ 'statusCode': 400, 'error': '2', 'data': 'no_credentials' });
                return;
            }
            needle('get', wapi_config.url + ':' + wapi_config.port + '/version', {}, { username: wapi_config.user, password: wapi_config.password, rejectUnauthorized: !wapi_config.insecure }).then(function (response) {
                if (response.body.error == 0 && response.body.data) {
                    wapi_config.password = "You shall not pass";
                    reply({ 'statusCode': 200, 'data': wapi_config });
                } else {
                    reply({ 'statusCode': 500, 'error': 7, 'message': response.body });
                }
            });
        });
    };

    var checkAPI = function (req, reply) {
        req.payload.password = new Buffer(req.payload.password, 'base64').toString("ascii");

        if (!req.payload.user) {
            reply({ 'statusCode': 400, 'error': 3, 'message': 'Missing param: API USER' });
        } else if (!req.payload.password) {
            reply({ 'statusCode': 400, 'error': 4, 'message': 'Missing param: API PASSWORD' });
        } else if (!req.payload.url) {
            reply({ 'statusCode': 400, 'error': 5, 'message': 'Missing param: API URL' });
        } else if (!req.payload.port) {
            reply({ 'statusCode': 400, 'error': 6, 'message': 'Missing param: API PORT' });
        } else if ((req.payload.url.indexOf('https://') == -1) && (req.payload.url.indexOf('http://') == -1)) {
            reply({ 'statusCode': 200, 'error': '1', 'data': 'protocol_error' });
        } else {
            needle('get', req.payload.url + ':' + req.payload.port + '/version', {}, { username: req.payload.user, password: req.payload.password, rejectUnauthorized: !req.payload.insecure }).then(function (response) {
                if (response.body.error == 0 && response.body.data) {
                    needle('get', req.payload.url + ':' + req.payload.port + '/agents/000', {}, { username: req.payload.user, password: req.payload.password, rejectUnauthorized: !req.payload.insecure }).then(function (response) {
                        if(!response.body.error) {
                            var manager_name = response.body.data.name;
                            needle('get', req.payload.url + ':' + req.payload.port + '/cluster/node', {}, { username: req.payload.user, password: req.payload.password, rejectUnauthorized: !req.payload.insecure }).then(function (response) {
                                if(!response.body.error){
                                    reply({"manager": manager_name, "node": response.body.data.node, "cluster": response.body.data.cluster});
                                }else if(response.body.error)
                                    reply({ 'statusCode': 500, 'error': 7, 'message': response.body.message }).code(500);
                            });
                        }else if(response.body.error)
                            reply({ 'statusCode': 500, 'error': 5, 'message': response.body.message }).code(500);
                        else
                            reply({ 'statusCode': 500, 'error': 5, 'message': 'Error occurred' }).code(500);
                    });
                } else if(response.body.error)
                    reply({ 'statusCode': 500, 'error': 5, 'message': response.body.message }).code(500);
                else
                    reply({ 'statusCode': 500, 'error': 5, 'message': 'Error occurred' }).code(500);
            });
        }
    };

    var getPath = function(wapi_config){
        var path = wapi_config.url;
        var protocol;
        if(wapi_config.url.startsWith("https://")){
            protocol = "https://";
        }
        else if(wapi_config.url.startsWith("http://")){
            protocol = "http://";
        }

        if(path.lastIndexOf("/") > protocol.length){
            path = path.substr(0, path.substr(protocol.length).indexOf("/") + protocol.length) +
            ":" + wapi_config.port + path.substr(path.substr(protocol.length).indexOf("/") + protocol.length);
        }
        else{
            path = wapi_config.url + ':' + wapi_config.port;
        }
        return path;
    }

    var getPciRequirement = function (req,reply) {
        var pciRequirements = {};
        var pci_description = "";

        try {
            pciRequirements = JSON.parse(fs.readFileSync(path.resolve(__dirname, pciRequirementsFile), 'utf8'));
        } catch (e) {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + pciRequirementsFile);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        };

        if(req.params.requirement == "all"){
            reply(pciRequirements);
            return;
        }

        if(pciRequirements[req.params.requirement])
            pci_description = pciRequirements[req.params.requirement];
        reply({pci: {requirement: req.params.requirement, description: pci_description}});
    };

    var errorControl = function (error, response) {
        if (error) {
            return ({ 'isError': true, 'body': { 'statusCode': 500, 'error': 5, 'message': 'Request error', 'errorMessage': error.message } });
        } else if (!error && response.body.error) {
            return ({ 'isError': true, 'body': { 'statusCode': 500, 'error': 6, 'message': 'Wazuh api error', 'errorData': response.body } });
        }
        return ({ 'isError': false });
    };

    var makeRequest = function (method, path, data, reply) {
        getConfig(function (wapi_config) {
            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                reply({ 'statusCode': 404, 'error': 2, 'message': 'Could not connect with elasticsearch' }).code(404);
                return;
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                reply({ 'statusCode': 404, 'error': 1, 'message': 'Credentials does not exists' }).code(404);
                return;
            }

            if (!data) { data = {}; }

            var options = {
                headers: { 'wazuh-app-version': package_info.version },
                username: wapi_config.user,
                password: wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            };

            var fullUrl = getPath(wapi_config) + path;
            needle.request(method, fullUrl, data, options, function (error, response) {
                var errorData = errorControl(error, response);
                if (errorData.isError) {
                    reply(errorData.body).code(500);
                } else {
                    reply(response.body);
                }
            });
        });
    };

    var requestApi = function (req, reply) {
        if (!req.payload.method) {
            reply({ 'statusCode': 400, 'error': 3, 'message': 'Missing param: Method' }).code(400);
        } else if (!req.payload.path) {
            reply({ 'statusCode': 400, 'error': 4, 'message': 'Missing param: Path' }).code(400);
        } else {
            makeRequest(req.payload.method, req.payload.path, req.payload.body, reply);
        }
    };

    var getApiSettings = function (req, reply) {
		getConfig(function (wapi_config) {
			if (wapi_config.error_code > 1) {
				//Can not connect to elasticsearch
				reply({ 'statusCode': 200, 'error': '1', 'data': 'no_elasticsearch' });
				return;
			} else if (wapi_config.error_code > 0) {
				//Credentials not found
				reply({ 'statusCode': 200, 'error': '1', 'data': 'no_credentials' });
				return;
			}
		});
    };

	// Fetch agent status and insert it directly on demand
	var fetchAgents = function (req, reply) {
		fetchAgentsExternal();
		reply({ 'statusCode': 200, 'error': '0', 'data': '' });
	}

    var postErrorLog = function (req, reply) {

        if (!req.payload.message) {
            server.log([blueWazuh, 'server', 'error'], 'Error logging failed:');
            server.log([blueWazuh, 'server', 'error'], 'You must provide at least one error message to log');
            reply({ 'statusCode': 500, 'message': 'You must provide at least one error message to log' });
        } else {
            server.log([blueWazuh, 'client', 'error'], req.payload.message);
            if (req.payload.details) {
                server.log([blueWazuh, 'client', 'error'], req.payload.details);
            }
            reply({ 'statusCode': 200, 'message': 'Error logged succesfully' });
        }
    };

    //Server routes

    /*
    * GET /api/wazuh-api/test
    * Returns if the wazuh-api configuration is working
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/checkAPI',
        handler: checkStoredAPI
    });

	/*
    * POST /api/wazuh-api/test
	* Check if credentials on POST connect to Wazuh API. Not storing them!
    * Returns if the wazuh-api configuration received in the POST body will work
    *
    **/
    server.route({
        method: 'POST',
        path: '/api/wazuh-api/checkAPI',
        handler: checkAPI
    });

    /*
    * POST /api/wazuh-api/request
    * Returns the request result (With error control)
    *
    **/
    server.route({
        method: 'POST',
        path: '/api/wazuh-api/request',
        handler: requestApi
    });

    /*
    * GET /api/wazuh-api/settings
    * Get Wazuh-API settings from elasticsearch index
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/settings',
        handler: getApiSettings
    });

    /*
    * GET /api/wazuh-api/pci/requirement
    * Return a PCI requirement description
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/pci/{requirement}',
        handler: getPciRequirement
    });

	/*
    * POST /api/wazuh/debug
    * Write in debug log
    *
    **/
    server.route({
        method: 'POST',
        path: '/api/wazuh/errlog',
        handler: postErrorLog
    });

    /*
    * GET /api/wazuh-api/pci/requirement
    * Return a PCI requirement description
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/fetchAgents',
        handler: fetchAgents
    });
};
