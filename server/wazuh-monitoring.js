module.exports = function (server, options) {

    const config = server.config();
    var _elurl = config.get('elasticsearch.url');
    var _eluser = config.get('elasticsearch.username');
    var _elpass = config.get('elasticsearch.password');
    const client = server.plugins.elasticsearch.client;

    var api_user;
    var api_pass;
    var api_url;
    var api_insecure;

    var colors = require('ansicolors');
    var blueWazuh = colors.blue('wazuh');

    var cron = require('node-cron');
    var needle = require('needle');

    var agentsArray = [];

    var loadCredentials = function (json) {
        if (json.error) {
            server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Error getting wazuh-api data: ' + json.error);
            return;
        }
        api_user = json.user;
        api_pass = json.password;
        api_url = json.url;
        api_insecure = json.insecure;
        checkAndSaveStatus();
    }

    var checkAndSaveStatus = function () {
        var payload = {
            'offset': 0,
            'limit': 1,
        };

        var options = {
            headers: { 'api-version': 'v1.3.0' },
            username: api_user,
            password: api_pass,
            rejectUnauthorized: !api_insecure
        };

        needle.request('get', api_url + '/agents', payload, options, function (error, response) {
            if (!error && response.body.data.totalItems) {
                checkStatus(response.body.data.totalItems);
            } else {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Wazuh API credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                return;
            }
        });
    };

    var checkStatus = function (maxSize, offset) {
        if (!maxSize) {
            server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] You must provide a max size');
        }

        var payload = {
            'offset': offset ? offset : 0,
            'limit': (250 < maxSize) ? 250 : maxSize
        };

        var options = {
            headers: { 'api-version': 'v1.3.0' },
            username: api_user,
            password: api_pass,
            rejectUnauthorized: !api_insecure
        };

        needle.request('get', api_url + '/agents', payload, options, function (error, response) {
            if (!error && response.body.data.items) {
                agentsArray = agentsArray.concat(response.body.data.items);
                if ((payload.limit + payload.offset) < maxSize) {
                    checkStatus(response.body.data.totalItems, payload.limit + payload.offset);
                } else {
                    saveStatus();
                }
            } else {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Wazuh api credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                return;
            }
        });
    };

    var saveStatus = function () {
        var fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);

        var todayIndex = 'wazuh-monitoring-' + fDate;

        client.indices.exists({ index: todayIndex }).then(
            function (result) {
                if (result) {
                    _elInsertData(todayIndex);
                } else {
                    _elCreateIndex(todayIndex);
                }
            }, function () {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Could not check if the index ' + todayIndex + ' exists.');
            }
        );
    };

    var _elCreateIndex = function (todayIndex) {
        client.indices.create({ index: todayIndex }).then(
            function () {
                client.indices.putMapping({ index: todayIndex, type: 'agent', body: { properties: { '@timestamp': { 'type': "date" }, 'status': { 'type': "keyword" }, 'ip': { 'type': "keyword" }, 'name': { 'type': "keyword" }, 'id': { 'type': "keyword" } } } }).then(
                    function () {
                        _elInsertData(todayIndex);
                    }, function () {
                        server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Error setting mapping while creating ' + todayIndex + ' index on elasticsearch.');
                    });
            }, function () {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Could not create ' + todayIndex + ' index on elasticsearch.');
            }
        );
    };

    var _elInsertData = function (todayIndex) {
        var body = '';
        agentsArray.forEach(function (element) {
            body += '{ "index":  { "_index": "' + todayIndex + '", "_type": "agent" } }\n';
            element["@timestamp"] = Date.now();
            body += JSON.stringify(element) + "\n";
        });
        if (body == '') {
            return;
        }
        client.bulk({
            index: todayIndex,
            type: 'agent',
            body: body
        }).then(function () {
            agentsArray.length = 0;
            setTimeout(function () {
                return;
            }, 60000);
        }, function (err) {
            server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Error inserting agent data into elasticsearch. Bulk request failed.');
        });
    };

    var getConfig = function (callback) {
        var needle = require('needle');

        if (_eluser && _elpass) {
            var options = {
                username: _eluser,
                password: _elpass,
                rejectUnauthorized: false
            };
        } else {
            var options = {
                rejectUnauthorized: false
            };
        }

        var elasticurl = _elurl + '/.kibana/wazuh-configuration/1';
        needle.get(elasticurl, options, function (error, response) {
            if (!error) {
                if (response.body.found) {
                    callback({ 'user': response.body._source.api_user, 'password': new Buffer(response.body._source.api_password, 'base64').toString("ascii"), 'url': response.body._source.api_url, 'insecure': response.body._source.insecure });
                } else {
                    callback({ 'error': 'no credentials', 'error_code': 1 });
                }
            } else {
                callback({ 'error': 'no elasticsearch', 'error_code': 2 });
            }
        });
    };

    var configureKibana = function () {
        return client.create({ index: '.kibana', type: 'index-pattern', id: 'wazuh-monitoring-*', body: { title: 'wazuh-monitoring-*', timeFieldName: '@timestamp'} });
    };

    server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Creating today index...');
    saveStatus();
    server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Configuring Kibana for working with "wazuh-monitoring-*" index pattern...');
    configureKibana().then(function () {
        server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Successfully initialized!');
    }, function (response) {
        if (response.statusCode != '409') {
            server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Could not configure "wazuh-monitoring-*" index pattern. Please, configure it manually on Kibana.');
        } else {
            server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Skipping "wazuh-monitoring-*" index pattern configuration: Already configured.');
        }
    });
    cron.schedule('0 */10 * * * *', function () {
        agentsArray.length = 0;
        getConfig(loadCredentials);
    }, true);

}
