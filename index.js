module.exports = (kibana) => new kibana.Plugin({
    id:      'wazuh',
    name:    'wazuh',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
        app: {
            id:          'wazuh',
            title:       'Wazuh',
            description: 'Wazuh App for Kibana',
            icon:        'plugins/wazuh/img/icon.png',
            main:        'plugins/wazuh/app',
            injectVars: (server, options) => {
                const serverConfig     = server.config();
                const configuredUrl    = server.config().get('tilemap.url');
                const isOverridden     = typeof configuredUrl === 'string' && configuredUrl !== '';
                const tilemapConfig    = serverConfig.get('tilemap');
                const regionmapsConfig = serverConfig.get('regionmap');
                const mapConfig        = serverConfig.get('map');
                
                regionmapsConfig.layers = (regionmapsConfig.layers) ? regionmapsConfig.layers : [];
                
                return {
                    kbnIndex:         serverConfig.get('kibana.index'),
                    esApiVersion:     serverConfig.get('elasticsearch.apiVersion'),
                    esShardTimeout:   serverConfig.get('elasticsearch.shardTimeout'),
                    regionmapsConfig: regionmapsConfig,
                    mapConfig:        mapConfig,
                    tilemapsConfig: {
                        deprecated: {
                            isOverridden: isOverridden,
                            config:       tilemapConfig
                        }
                    }
                };
            }
        }
    },
    init: require('./init.js')
});