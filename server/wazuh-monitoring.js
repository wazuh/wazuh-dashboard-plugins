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

    /*cron.schedule('* 0,30 * * * *', function () {
        agentsArray.length = 0;
        getConfig(loadCredentials);
    }, true);*/

    //UNCOMMENT IN ORDER TO DEBUG
    /*cron.schedule('0 * * * * *', function () {
        agentsArray.length = 0;
        getConfig(loadCredentials);
    }, true);*/

    var loadCredentials = function (json) {
        if (json.error) {
            console.log('Error getting wazuh-api data: ' + json.error);
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
            headers: { 'api-version': 'v1.2' },
            username: api_user,
            password: api_pass,
            rejectUnauthorized: !api_insecure
        };

        needle.request('get', api_url + '/agents', payload, options, function (error, response) {
            if (!error) {
                checkStatus(response.body.data.totalItems);
            } else {
                console.log('Could not get data from Wazuh api. Reason: ' + response.body.message);
                return;
            }
        });
    };

    var checkStatus = function (maxSize, offset) {
        if (!maxSize) {
            console.log('You must provide a max size');
        }

        var payload = {
            'offset': offset ? offset : 0,
            'limit': (10 < maxSize) ? 10 : maxSize
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
                console.log('Could not get data from Wazuh api. Reason: ' + response.body.message);
                return;
            }
        });
    };

    var saveStatus = function () {
        var fDate = new Date().toISOString().replace(/T/, '-')
            .replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);

        var todayIndex = 'wazuh-monitoring-'+fDate;

        client.indices.exists(false, false, false, todayIndex).then(
            function () {
                _elCreateIndex(todayIndex);
            }, function () {
                _elInsertData(todayIndex);
            }
        );
    };

    var _elCreateIndex = function (todayIndex) {
        client.indices.create({ index: todayIndex, type: 'agent', body: '{"agent": {"properties": {"@timestamp": {"type": "date" }, "status": {"type": "string","index": "not_analyzed"},"ip": {"type": "string","index": "not_analyzed"},"name": {"type": "string","index": "not_analyzed"},"id": {"type": "string","index": "not_analyzed"}}}}' }).then(
            function () {
                client.indices.putMapping({index: todayIndex, type: 'agent', body: '{"agent": {"properties": {"@timestamp": {"type": "date" }, "status": {"type": "string","index": "not_analyzed"},"ip": {"type": "string","index": "not_analyzed"},"name": {"type": "string","index": "not_analyzed"},"id": {"type": "string","index": "not_analyzed"}}}}' }).then(function () {
                    _elInsertData(todayIndex);
                }, function () {
                    console.log('Error setting mapping while creating ' + todayIndex + ' index on elasticsearch.');
                });
            }, function () {
                console.log('Could not create ' + todayIndex + ' index on elasticsearch.');
            }
        );
    };

    var _elInsertData = function (todayIndex) {
        var body = '';
        agentsArray.forEach(function (element) {
            body += '{ "index":  { "_index": "'+todayIndex+'", "_type": "agent" } }\n';
            element["@timestamp"] = Date.now();
            body += JSON.stringify(element) + "\n";
        });
        client.bulk({
            index: todayIndex,
            type: 'agent',
            body: body
        }).then(function () { }, function (err) {
            console.log('Error inserting agent data into elasticsearch. Bulk request failed.');
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