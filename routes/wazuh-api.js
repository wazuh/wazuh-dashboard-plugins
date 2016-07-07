module.exports = function (server, options) {

    var config = require('../config.js');

    //Handlers - Generic

    var getConfig = function (callback) {
        var needle = require('needle');
        var elasticurl = config.elasticPath+'/.kibana/wazuh-configuration/1';
        needle.get(elasticurl, function (error, response) {
            if (!error) {
                if (response.body.found) {
                    callback({ 'user': response.body._source.api_user, 'password': new Buffer(response.body._source.api_password, 'base64').toString("ascii"), 'url': response.body._source.api_url, 'insecure': response.body._source.insecure, 'error': '', 'error_code': 0 });
                } else {
                    callback({ 'user': '', 'password': '', 'url': '', 'insecure': '', 'error': 'no credentials', 'error_code': 1 });
                }
            } else {
                callback({ 'user': '', 'password': '', 'url': '', 'insecure': '', 'error': 'no elasticsearch', 'error_code': 2 });
            }
        });
    };

    //Handlers - Test API

    var testApiAux2 = function (error, response, insecure) {
        if (!error && response && response.body.data == 'Welcome to Wazuh HIDS API') {
            return { 'statusCode': 200, 'error': '', 'data': 'ok' };
        } else if (response && response.statusCode == 401) {
            return { 'statusCode': 200, 'error': '1', 'data': 'unauthorized' };
        } else if (!error && response && response.body.data != 'Welcome to Wazuh HIDS API') {
            return { 'statusCode': 200, 'error': '1', 'data': 'bad_url' };
        } else {
            if (!insecure) {
                return { 'statusCode': 200, 'error': '1', 'data': 'self_signed' };
            } else {
                return { 'statusCode': 200, 'error': '1', 'data': 'not_running' };
            }
        }
    };

    var testApiAux1 = function (error, response, wapi_config, needle, callback) {
        if (!error && response && response.body.data == 'Welcome to Wazuh HIDS API') {
            callback({ 'statusCode': 200, 'error': '', 'data': 'ok' });
        } else if (response && response.statusCode == 401) {
            callback({ 'statusCode': 200, 'error': '1', 'data': 'unauthorized' });
        } else if (!error && response && response.body.data != 'Welcome to Wazuh HIDS API') {
            callback({ 'statusCode': 200, 'error': '1', 'data': 'bad_url' });
        } else {
            needle.request('get', wapi_config.url, {}, { username: wapi_config.user, password: wapi_config.password, rejectUnauthorized: !wapi_config.insecure }, function (error, response) {
                callback(testApiAux2(error, response, wapi_config.insecure));
            });
        }
    };

    var testApi = function (req, reply) {
        var needle = require('needle');
        needle.defaults({
            open_timeout: 5000
        });

        //Get config from elasticsearch
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

            if (wapi_config.url.indexOf('https://') == -1) {
                if (wapi_config.url.indexOf('http://') == -1) {
                    reply({ 'statusCode': 200, 'error': '1', 'data': 'protocol_error' });
                }
            } else {
                needle.request('get', wapi_config.url, {}, { username: wapi_config.user, password: wapi_config.password }, function (error, response) {
                    testApiAux1(error, response, wapi_config, needle, function (test_result) {
                        reply(test_result);
                    });
                });
            }
        });
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
                open_timeout: 5000
            });

            if (!data) {
                data = {};
            }

            var options = {
                headers: { 'api-version': 'v1.2' },
                username: wapi_config.user,
                password: wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            };

            var fullUrl = wapi_config.url + path;
            
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


    //Server routes

    /*
    * GET /api/wazuh-api/test
    * Returns if the wazuh-api configuration is working
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/test',
        handler: testApi
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

};
