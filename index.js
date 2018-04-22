/*
 * Wazuh app - Module for Kibana plugin definition
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

module.exports = (kibana) => new kibana.Plugin({
    id: 'wazuh',
    name: 'wazuh',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
        app: {
            id: 'wazuh',
            title: 'Wazuh',
            description: 'Wazuh app for Kibana',
            icon: 'plugins/wazuh/img/icon.png',
            main: 'plugins/wazuh/app',
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
    init: require('./init.js')
});
