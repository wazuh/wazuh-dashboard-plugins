/*
 * Wazuh app - Module for Kibana plugin definition
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Imports the init module
import { initApp } from './init';
import { resolve } from 'path';

export default kibana =>
  new kibana.Plugin({
    id: 'wazuh',
    name: 'wazuh',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      app: {
        id: 'wazuh',
        title: 'Wazuh',
        description: 'Wazuh app for Kibana',
        icon: 'plugins/wazuh/img/icon.svg',
        main: 'plugins/wazuh/app'
      },
      hacks: ['plugins/wazuh/icon-style'],
      __bundleProvider__(kbnServer) {
        kbnServer.uiBundles.addPostLoader({
          test: /\.pug$/,
          include: resolve(__dirname, 'public'),
          loader: require.resolve('pug-loader'),
          enforce: undefined
        });
      }
    },
    init(server, options) {
      // Kibana spaces locker
      const xpackMainPlugin = server.plugins.xpack_main;

      if (xpackMainPlugin) {
        xpackMainPlugin.registerFeature({
          id: 'wazuh',
          name: 'Wazuh',
          app: ['wazuh', 'kibana', 'elasticsearch'],
          navLinkId: 'wazuh',
          privileges: {}
        });
      }

      return initApp(server, options);
    }
  });
