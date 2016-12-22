module.exports = function (kibana) {
  return new kibana.Plugin({
    id: 'wazuh',
    name: 'wazuh',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      app: {
        id: 'wazuh',
        title: 'Wazuh',
        description: 'Wazuh App for Kibana',
		icon: 'plugins/wazuh/img/icon.png',
        main: 'plugins/wazuh/app',
        injectVars: function (server, options) {
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout'),
            tilemap: config.get('tilemap')
          };
        }
      }
    },
    init: require('./init.js')
  });
};

