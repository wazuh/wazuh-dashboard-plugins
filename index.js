//var searchApi = require('plugins/wazuh/server/api/search');
var path = require('path');
module.exports = function (kibana) {
    var mainFile = 'plugins/wazuh/app';
  return new kibana.Plugin({
    name: 'wazuh',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      app: {
        title: 'Wazuh App',
        description: 'Sample for Wazuh plugin',
        icon: 'plugins/wazuh/icon.svg',
        main: 'plugins/wazuh/app',
        injectVars: function (server, options) {
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout')
          };
        }
      }
    },
    init: require('./init.js')
  });
};

