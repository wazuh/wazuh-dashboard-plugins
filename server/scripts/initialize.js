module.exports = function (server, options) {

    const client = server.plugins.elasticsearch.client;
    const uiSettings = server.uiSettings();

    const colors = require('ansicolors');
    const blueWazuh = colors.blue('wazuh');

    const fs = require('fs');
    const OBJECTS_FILE = 'plugins/wazuh/server/scripts/integration_files/objects_file.json';
    const MAPPING_FILE = 'plugins/wazuh/server/scripts/integration_files/template_file.json';
    var map_jsondata = {};

    var setTemplate = function () {
        client.indices.exists({ index: 'ossec-*' }).then(
            function (result) {
                if (result) {
                    server.log([blueWazuh, 'initialize', 'info'], 'Index pattern "ossec-*" exists.');
                    configureKibana();
                } else {
                    server.log([blueWazuh, 'initialize', 'info'], 'Index pattern "ossec-*" not exists. Creating...');
                    createAndPutTemplate();
                }
            }, function () {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not check if index pattern "ossec-*" exists.');
            }
        );
    };

    var createAndPutTemplate = function () {
        var fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
        var todayIndex = 'ossec-' + fDate;

        client.indices.create({ index: todayIndex }).then(
            function () {
                try {
                    map_jsondata = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
                } catch (e) {
                    server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
                    server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + MAPPING_FILE);
                    server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
                };
                client.indices.putMapping({ index: 'ossec-*', type: 'ossec', body: map_jsondata}).then(
                    function () {
                        server.log([blueWazuh, 'initialize', 'info'], 'Index pattern "ossec-*" was initialized successfully.');
                        insertSampleData(todayIndex);
                    }, function () {
                        server.log([blueWazuh, 'initialize', 'error'], 'Could not put mapping for "ossec-*" on elasticsearch.');
                    });
            }, function () {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not create ' + todayIndex + ' index on elasticsearch.');
            }
        );
    };

    var insertSampleData = function (todayIndex) {
        var SAMPLE_DATA = {"rule": { "sidid": 0, "firedtimes": 1, "groups": [ ], "PCI_DSS": [ ], "description": "This is the first alert on your ELK Cluster, please start OSSEC Manager and Logstash server to start shipping alerts.", "AlertLevel": 0 }, "full_log": "This is the first alert on your ELK Cluster, please start OSSEC Manager and Logstash server to start shipping alerts.", "decoder": { }, "@timestamp": new Date().toISOString() };

        client.create({ index: todayIndex, type: 'ossec', id: 'sample', body: SAMPLE_DATA }).then(
            function () {
                server.log([blueWazuh, 'initialize', 'info'], 'Sample data was inserted successfully.');
                configureKibana();
            }, function () {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not insert sample data.');
            });
    };

    var configureKibana = function () {
        server.log([blueWazuh, 'initialize', 'info'], 'Configuring Kibana for working with "ossec-*" index pattern...');
        client.create({ index: '.kibana', type: 'index-pattern', id: 'ossec-*', body: { title: 'ossec-*', timeFieldName: '@timestamp', fields: prepareMappingCache() } })
            .then(function () {
                server.log([blueWazuh, 'initialize', 'info'], 'Successfully configured.');
                setDefaultIndex();
            }, function (response) {
                if (response.statusCode != '409') {
                    server.log([blueWazuh, 'initialize', 'error'], 'Could not configure "ossec-*" index pattern.');
                } else {
                    server.log([blueWazuh, 'initialize', 'info'], 'Skipping "ossec-*" index pattern configuration: Already configured.');
                }
            });
    };

    var prepareMappingCache = function () {
        if (!map_jsondata.ossec) {
            try {
                map_jsondata = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
            } catch (e) {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
                server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + MAPPING_FILE);
                server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
            };
        }
        var cacheJson = [];
        for (var key in map_jsondata.ossec.properties) {
            if (!Object.prototype.hasOwnProperty.call(map_jsondata.ossec.properties, key)) continue;
            var element = map_jsondata.ossec.properties[key];
            var tmpObj = {};
            if (element.properties) {
                for (var _subKey in element.properties) {
                    tmpObj = {};
                    if (!Object.prototype.hasOwnProperty.call(element.properties, _subKey)) continue;
                    var _subEle = element.properties[_subKey];
                    if (_subEle.type == 'long') tmpObj.type = 'number';
                    else if (_subEle.type == 'date') tmpObj.type = 'date';
                    else if (_subEle.type == 'geo_point') tmpObj.type = 'geo_point';
                    else tmpObj.type = 'string';
                    if (_subEle.index == 'analyzed') tmpObj.analyzed = true;
                    else if (_subEle.type == 'text') tmpObj.analyzed = true;
                    else tmpObj.analyzed = false;
                    if (_subEle.index != 'no') tmpObj.indexed = true;
                    else tmpObj.index = false;
                    if (_subEle.doc_values) tmpObj.doc_values = _subEle.doc_values;
                    else tmpObj.doc_values = false;
                    tmpObj.count = 0;
                    tmpObj.scripted = false;
                    tmpObj.name = key + '.' + _subKey;
                    cacheJson.push(tmpObj);
                };
            } else {
                var tmpObj = {};
                if (element.type == 'long') tmpObj.type = 'number';
                else if (element.type == 'date') tmpObj.type = 'date';
                else if (element.type == 'geo_point') tmpObj.type = 'geo_point';
                else tmpObj.type = 'string';
                if (element.index == 'analyzed') tmpObj.analyzed = true;
                else if (element.type == 'text') tmpObj.analyzed = true;
                else tmpObj.analyzed = false;
                if (element.index != 'no') tmpObj.indexed = true;
                else tmpObj.index = false;
                if (element.doc_values) tmpObj.doc_values = element.doc_values;
                else tmpObj.doc_values = false;
                tmpObj.count = 0;
                tmpObj.scripted = false;
                tmpObj.name = key;
                cacheJson.push(tmpObj);
            }
        };
        cacheJson.push({ name: '_score', scripted: false, count: 0, doc_values: false, index: false, analyzed: false, type: 'number' });
        cacheJson.push({ name: '_index', scripted: false, count: 0, doc_values: false, index: false, analyzed: false, type: 'string' });
        cacheJson.push({ name: '_type', scripted: false, count: 0, doc_values: false, index: false, analyzed: false, type: 'string' });
        cacheJson.push({ name: '_id', scripted: false, count: 0, doc_values: false, index: false, analyzed: false, type: 'string' });
        cacheJson.push({ name: '@version', scripted: false, count: 0, doc_values: false, index: false, analyzed: false, type: 'string' });
        cacheJson.push({ name: '_source', scripted: false, count: 0, doc_values: false, index: false, analyzed: false, type: '_source' });
        return JSON.stringify(cacheJson);
    };

    var setDefaultIndex = function () {
        server.log([blueWazuh, 'initialize', 'info'], 'Setting Kibana default index pattern to "ossec-*"...');
        
        uiSettings.set('defaultIndex', 'ossec-*')
            .then(function () {
                setDefaultTime();
            }).catch(function () {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not set default index.');
            });
    };

    var setDefaultTime = function () {
        server.log([blueWazuh, 'initialize', 'info'], 'Setting Kibana default time to last 24h...');

        uiSettings.set('timepicker:timeDefaults', '{  \"from\": \"now-24h\",  \"to\": \"now\",  \"mode\": \"quick\"}')
            .then(function () {
                importObjects();
            }).catch(function (data) {
                server.log([blueWazuh, 'initialize', 'warning'], 'Could not set default time. Please, configure it manually.');
                importObjects();
            });
    };

    var importObjects = function () {
        server.log([blueWazuh, 'initialize', 'info'], 'Importing objects (Searchs, visualizations and dashboards) into Elasticsearch...');
        try {
            var objects = JSON.parse(fs.readFileSync(OBJECTS_FILE, 'utf8'));
        } catch (e) {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the objects file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + OBJECTS_FILE);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        }

        var body = '';
        objects.forEach(function (element) {
            body += '{ "index":  { "_index": ".kibana", "_type": "'+element._type+'", "_id": "'+element._id+'" } }\n';
            body += JSON.stringify(element._source) + "\n";
        });

        client.bulk({
            index: '.kibana',
            body: body
        }).then(function () {
            client.indices.refresh({ index: ['.kibana', 'ossec-*'] });
            server.log([blueWazuh, 'initialize', 'info'], 'Templates, mappings, index patterns, visualizations, searches and dashboards were successfully installed. App ready to be used.');
        }, function (err) {
            server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch. Bulk request failed.');
        });
    };

    setTemplate();

};