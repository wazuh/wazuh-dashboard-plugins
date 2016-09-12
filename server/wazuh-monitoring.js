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

    var cron = require('node-cron');
    var needle = require('needle');

    var agentsArray = [];

    cron.schedule('0 0,30 * * * *', function () {
        agentsArray.length = 0;
        getConfig(loadCredentials);
    }, true);

    var loadCredentials = function (json) {
        if (json.error) {
            console.log('[Wazuh agents monitoring] Error getting wazuh-api data: ' + json.error);
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
                console.log('[Wazuh agents monitoring] Wazuh API credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                return;
            }
        });
    };

    var checkStatus = function (maxSize, offset) {
        if (!maxSize) {
            console.log('[Wazuh agents monitoring] You must provide a max size');
        }

        var payload = {
            'offset': offset ? offset : 0,
            'limit': (250 < maxSize) ? 250 : maxSize
        };

        var options = {
            headers: { 'api-version': 'v1.2' },
            username: api_user,
            password: api_pass,
            rejectUnauthorized: !api_insecure
        };

        needle.request('get', api_url + '/agents', payload, options, function (error, response) {
            if (!error) {
                agentsArray = agentsArray.concat(response.body.data.items);
                if ((payload.limit + payload.offset) < maxSize) {
                    checkStatus(response.body.data.totalItems, payload.limit + payload.offset);
                } else {
                    saveStatus();
                }
            } else {
                console.log('[Wazuh agents monitoring] Wazuh api credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                return;
            }
        });
    };

    var saveStatus = function () {
        var fDate = new Date().toISOString().replace(/T/, '-')
            .replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);

        var todayIndex = 'wazuh-monitoring-' + fDate;

        client.indices.exists({ index: todayIndex }).then(
            function (result) {
                if (result) {
                    _elInsertData(todayIndex);
                } else {
                    _elCreateIndex(todayIndex);
                }
            }, function () {
                console.log('[Wazuh agents monitoring] Could not check if the index ' + todayIndex + ' exists.');
            }
        );
    };

    var _elCreateIndex = function (todayIndex) {
        client.indices.create({ index: todayIndex }).then(
            function () {
                client.indices.putMapping({ index: todayIndex, type: 'agent', body: { properties: { '@timestamp': { 'type': "date" }, 'status': { 'type': "string", 'index': "not_analyzed" }, 'ip': { 'type': "string", 'index': "not_analyzed" }, 'name': { 'type': "string", 'index': "not_analyzed" }, 'id': { 'type': "string", 'index': "not_analyzed" } } } }).then(
                    function () {
                        _elInsertData(todayIndex);
                    }, function () {
                        console.log('[Wazuh agents monitoring] Error setting mapping while creating ' + todayIndex + ' index on elasticsearch.');
                    });
            }, function () {
                console.log('[Wazuh agents monitoring] Could not create ' + todayIndex + ' index on elasticsearch.');
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
        client.bulk({
            index: todayIndex,
            type: 'agent',
            body: body
        }).then(function () { }, function (err) {
            console.log('[Wazuh agents monitoring] Error inserting agent data into elasticsearch. Bulk request failed.');
        });
        agentsArray.length = 0;
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

}
