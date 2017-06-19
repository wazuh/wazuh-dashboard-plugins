module.exports = function (server, options) {
	// Require some libraries
	const pciRequirementsFile = '';
	const fs = require('fs');
	const path = require('path');
	var fetchAgentsExternal = require(path.resolve(__dirname, "../wazuh-monitoring.js"));
	const wazuh_config_file = '../../configuration/config.json';
	var colors = require('ansicolors');
	var blueWazuh = colors.blue('wazuh');
	var wazuh_config = {};
	
	// Consts values, versions.
    const MIN_VERSION = [2,0,0];
    const MAX_VERSION = [3,0,0];
	const wazuh_api_version = 'v2.0.0';
	
	// Read Wazuh App configuration file
	try {
		wazuh_config = JSON.parse(fs.readFileSync(path.resolve(__dirname, wazuh_config_file), 'utf8'));
	} catch (e) {
		server.log([blueWazuh, 'initialize', 'error'], 'Could not read the Wazuh configuration file file.');
		server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + wazuh_config_file);
		server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
	};	
	
	
	// Elastic JS Client
	const serverConfig = server.config();
	const elasticsearch = require('elasticsearch');
	const elasticRequest = server.plugins.elasticsearch.getCluster('data');
	
    //Handlers - Generic

    var checkVersion = function (version) {
        version = version.replace('v', '');
        var _current = version.split('.');

        if (_current.length == 3) {
            for (var i = 0; i < 3; i++) {
                var tmp = parseInt(_current[i]);
                if (tmp == NaN) {
                    return false;
                } else if (!( (MIN_VERSION[i] <= tmp) && (tmp <= MAX_VERSION[i]) )) {
                    return false;
                }
            }
        } else {
            return false;
        }
        return true;
    }

    var getConfig = function (callback) {
		elasticRequest.callWithInternalUser('search', { index: '.kibana', type: 'wazuh-configuration', q: 'active:true'}).then(
			function (data) {
					if (data.hits.total == 1) {
						callback({ 'user': data.hits.hits[0]._source.api_user, 'password': new Buffer(data.hits.hits[0]._source.api_password, 'base64').toString("ascii"), 'url': data.hits.hits[0]._source.url, 'port': data.hits.hits[0]._source.api_port, 'insecure': data.hits.hits[0]._source.insecure, 'manager': data.hits.hits[0]._source.manager, 'extensions': data.hits.hits[0]._source.extensions });
					} else {
						callback({ 'error': 'no credentials', 'error_code': 1 }); 
					}
			}, function (error) {
					callback({ 'error': 'no elasticsearch', 'error_code': 2 });
			});
    };

	
	
    var getAPI_entries = function (req,reply) {
		elasticRequest.callWithRequest(req, 'search', { index: '.kibana', type: 'wazuh-configuration'}).then(
			function (data) {
				reply(data.hits.hits);
            }, function (data, error) {
				reply(data);
            });
    };

    var deleteAPI_entries = function (req,reply) {
		elasticRequest.callWithRequest(req, 'delete', { index: '.kibana', type: 'wazuh-configuration', id: req.params.id}).then(
			function (data) {
				reply(data);
            }, function (data, error) {
				reply(data);
            });
    };
	
    var setAPI_entry_default = function (req,reply) {
		// Searching for previous default
		elasticRequest.callWithRequest(req, 'search', { index: '.kibana', type: 'wazuh-configuration', q: 'active:true'}).then(
            function (data) {
                if (data.hits.total == 1) {
					// Setting off previous default
                    var idPreviousActive = data.hits.hits[0]._id;
					elasticRequest.callWithRequest(req, 'update', { index: '.kibana', type: 'wazuh-configuration', id: idPreviousActive, body: {doc: {"active": "false"}} }).then(
					function () {
						// Set new default
						elasticRequest.callWithRequest(req, 'update', { index: '.kibana', type: 'wazuh-configuration', id: req.params.id, body: {doc: {"active": "true"}} }).then(
						function () {
							reply({ 'statusCode': 200, 'message': 'ok' });
						}, function (error) {
							reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch' }).code(500);
						});	
					}, function (error) {
						reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch' }).code(500);
					});					
                }else{
					// Set new default
					elasticRequest.callWithRequest(req, 'update', { index: '.kibana', type: 'wazuh-configuration', id: req.params.id, body: {doc: {"active": "true"}} }).then(
					function () {
						reply({ 'statusCode': 200, 'message': 'ok' });
					}, function (error) {
						reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch' }).code(500);
					});		
				}
            }, function () {
                reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not set API default entry' }).code(500);
         });
			
		
    };	

	var getPciRequirement = function (req,reply) {

		const pciRequirementsFile = '../startup/integration_files/pci_requirements.json';
		var pciRequirements = {};

		try {
			pciRequirements = JSON.parse(fs.readFileSync(path.resolve(__dirname, pciRequirementsFile), 'utf8'));
		} catch (e) {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
			server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + pciRequirementsFile);
			server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};
		var pci_description = "";
		
		if(req.params.requirement == "all"){
			reply(pciRequirements);
			return;
		}
		
		if(pciRequirements[req.params.requirement])
			pci_description = pciRequirements[req.params.requirement];
		reply({pci: {requirement: req.params.requirement, description: pci_description}});
    };

	var getExtensions = function (req,reply) {
        elasticRequest.callWithRequest(req, 'search', { index: '.kibana', type: 'wazuh-configuration'}).then(
			function (data) {
				reply(data.hits.hits);
            }, function (data, error) {
				reply(data);
            });
    };
	
    var toggleExtension = function (req,reply) {
		// Toggle extenion state
		var extension = {};
		extension[req.params.extensionName] = (req.params.extensionValue == "true") ? true : false;
		
		elasticRequest.callWithRequest(req, 'update',{ index: '.kibana', type: 'wazuh-configuration', id: req.params.id, body: {doc: {"extensions" : extension}} }).then(
		function () {
			reply({ 'statusCode': 200, 'message': 'ok' });
		}, function (error) {
			reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch' }).code(500);
		});
    };	
	
    //Handlers - Test API

    var testApiAux2 = function (error, response, wapi_config) {
        if (!error && response && response.body.data && checkVersion(response.body.data)) {
            return { 'statusCode': 200, 'data': 'ok', 'manager' : wapi_config.manager, 'extensions' : wapi_config.extensions };
        } else if (response && response.statusCode == 401) {
            return { 'statusCode': 200, 'error': '1', 'data': 'unauthorized' };
        } else if (!error && response && (!response.body.data || !checkVersion(response.body.data)) ) {
            return { 'statusCode': 200, 'error': '1', 'data': 'bad_url' };
        } else {
            if (!wapi_config.insecure) {
                return { 'statusCode': 200, 'error': '1', 'data': 'self_signed' };
            } else {
                return { 'statusCode': 200, 'error': '1', 'data': 'not_running' };
            }
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
    
    var testApiAux1 = function (error, response, wapi_config, needle, callback) {
        if (!error && response && response.body.data && checkVersion(response.body.data)) {
            callback({ 'statusCode': 200, 'data': 'ok', 'manager' : wapi_config.manager, 'extensions' : wapi_config.extensions});
        } else if (response && response.statusCode == 401) {
            callback({ 'statusCode': 200, 'error': '1', 'data': 'unauthorized' });
        } else if (!error && response && (!response.body.data || !checkVersion(response.body.data)) ) {
            callback({ 'statusCode': 200, 'error': '1', 'data': 'bad_url' });
        } else {
            needle.request('get', getPath(wapi_config)+'/version', {}, { username: wapi_config.user, password: wapi_config.password, rejectUnauthorized: !wapi_config.insecure }, function (error, response) {
                callback(testApiAux2(error, response, wapi_config));
            });
        }
    };

    var checkStoredAPI = function (req, reply) {
        var needle = require('needle');
        needle.defaults({
            open_timeout: wazuh_config.wazuhapi.requests.timeout
        });

        //Get config from elasticsearch
        getConfig(function (wapi_config) {

            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                reply({ 'statusCode': 200, 'error': '1', 'data': 'no_elasticsearch' });
                return;
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                reply({ 'statusCode': 200, 'error': '2', 'data': 'no_credentials' });
                return;
            }

            if ((wapi_config.url.indexOf('https://') == -1) && (wapi_config.url.indexOf('http://') == -1)) {
                reply({ 'statusCode': 200, 'error': '1', 'data': 'protocol_error' });
            } else {
                needle.request('get', getPath(wapi_config)+'/version', {}, { username: wapi_config.user, password: wapi_config.password }, function (error, response) {
                    testApiAux1(error, response, wapi_config, needle, function (test_result) {
                        reply(test_result);
                    });
                });
            }
        });
    };

	var checkAPI = function (req, reply) {
        var needle = require('needle');
        needle.defaults({
            open_timeout: 1500
        });
		if (!req.payload.user) {
            reply({ 'statusCode': 400, 'error': 3, 'message': 'Missing param: API USER' }).code(400);
        } else if (!req.payload.password) {
            reply({ 'statusCode': 400, 'error': 4, 'message': 'Missing param: API PASSWORD' }).code(400);
		} else if (!req.payload.url) {
            reply({ 'statusCode': 400, 'error': 4, 'message': 'Missing param: API URL' }).code(400);
		} else if (!req.payload.port) {
            reply({ 'statusCode': 400, 'error': 4, 'message': 'Missing param: API PORT' }).code(400);			
        } else {
			req.payload.password = new Buffer(req.payload.password, 'base64').toString("ascii");
            if ((req.payload.url.indexOf('https://') == -1) && (req.payload.url.indexOf('http://') == -1)) {
                reply({ 'statusCode': 200, 'error': '1', 'data': 'protocol_error' });
            } else {
                needle.request('get', getPath(req.payload)+'/version', {}, { username: req.payload.user, password: req.payload.password, rejectUnauthorized: !req.payload.insecure }, function (error, response) {
                    testApiAux1(error, response, req.payload, needle, function (test_result) {
						if(test_result.data == "ok"){
							needle.request('get', getPath(req.payload)+'/agents/000', {}, { username: req.payload.user, password: req.payload.password, rejectUnauthorized: !req.payload.insecure }, function (error, response) {
								if(!error && !response.body.error)
									reply(response.body.data.name);
								else if(response.body.error)
									reply({ 'statusCode': 500, 'error': 5, 'message': response.body.message }).code(500);
								else
									reply({ 'statusCode': 500, 'error': 5, 'message': 'Error occurred' }).code(500);
							});
						}else{
							reply(test_result);
						}
                    });
                });
            }
        }
		

    };
	

    //Handlers - Route request

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
            var needle = require('needle');
            needle.defaults({
                open_timeout: wazuh_config.wazuhapi.requests.timeout
            });

            if (!data) {
                data = {};
            }

            var options = {
                headers: { 'api-version': wazuh_api_version },
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

    //Handlers - Save config

    var saveApi = function (req, reply) {
        if (!(req.payload.user && req.payload.password && req.payload.url && req.payload.port)) {
            reply({ 'statusCode': 400, 'error': 7, 'message': 'Missing data' }).code(400);
            return;
        }
		var settings = { 'api_user': req.payload.user, 'api_password': req.payload.password, 'url': req.payload.url, 'api_port': req.payload.port , 'insecure': req.payload.insecure, 'component' : 'API', 'active' : req.payload.active, 'manager' : req.payload.manager, 'extensions' : req.payload.extensions};
		
        elasticRequest.callWithRequest(req, 'index', { index: '.kibana', type: 'wazuh-configuration', body: settings, refresh: true }) 
            .then(function (response) {
                reply({ 'statusCode': 200, 'message': 'ok', 'response' : response });
            }, function (error) {
                reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch' }).code(500);
            });
    };
    
   	//Handlers - Update API Hostname

    var updateApiHostname = function (req,reply) {
        elasticRequest.callWithRequest(req, 'update', { index: '.kibana', type: 'wazuh-configuration', id:req.params.id, body: {doc: {"manager": req.payload.manager}} }).then(
            function () {
                reply({ 'statusCode': 200, 'message': 'ok' });
            }, function (error) {
                reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch' }).code(500);
            });		
    };
	
	//Handlers - Get API Settings

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
	var fetchAgents = function (req, reply){
		fetchAgentsExternal();
		reply({ 'statusCode': 200, 'error': '0', 'data': '' });
	}
	
	
	
    //Handlers - error loggin

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
        path: '/api/wazuh-api/check',
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
        path: '/api/wazuh-api/check',
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
    * PUT /api/wazuh-api/settings
    * Save the given settings into elasticsearch
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-api/settings',
        handler: saveApi
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
    * GET /api/wazuh-api/apiEntries
    * Get Wazuh-API entries list (Multimanager) from elasticsearch index
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/apiEntries',
        handler: getAPI_entries
    });
	
    /*
    * DELETE /api/wazuh-api/settings
    * Delete Wazuh-API entry (multimanager) from elasticsearch index
    *
    **/
    server.route({
        method: 'DELETE',
        path: '/api/wazuh-api/apiEntries/{id}',
        handler: deleteAPI_entries
    });	

    /*
    * PUT /api/wazuh-api/settings
    * Set Wazuh-API as default (multimanager) on elasticsearch index
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-api/apiEntries/{id}',
        handler: setAPI_entry_default
    });	
	
	
    /* 
    * PUT /api/wazuh-api/extension/toggle/documentId/extensionName/trueorfalse
    * Toggle extension state: Enable / Disable
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-api/extension/toggle/{id}/{extensionName}/{extensionValue}',
        handler: toggleExtension
    });	

    /* 
    * GET /api/wazuh-api/extension
    * Return extension state list
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/extension',
        handler: getExtensions
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
	
    /* 
    * PUT /api/wazuh-api/updateApiHostname/apiId
    * Update the API hostname
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-api/updateApiHostname/{id}',
        handler: updateApiHostname
    });
};