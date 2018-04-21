import init from './init';

export default kibana => new kibana.Plugin({
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
            uses: [
              'visTypes',
              'visResponseHandlers',
              'visRequestHandlers',
              'visEditorTypes',
              'savedObjectTypes',
              'spyModes',
              'fieldFormats',
            ],
            injectVars: server => {
                return server.plugins.kibana.injectVars(server);
            }
        }
    },
    init
});