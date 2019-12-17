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

export default function (kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],
    id: 'wazuh',
    name: 'wazuh',
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

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server, options) { // eslint-disable-line no-unused-vars
      const xpackMainPlugin = server.plugins.xpack_main;
      if (xpackMainPlugin) {
        const featureId = 'wazuh';

        xpackMainPlugin.registerFeature({
          id: featureId,
          name: 'Wazuh',
          navLinkId: featureId,
          icon: 'questionInCircle',
          app: [featureId, 'kibana', 'elasticsearch'],
          catalogue: [],
          privileges: {
            all: {
              api: [],
              savedObject: {
                all: [],
                read: [],
              },
              ui: ['show'],
            },
            read: {
              api: [],
              savedObject: {
                all: [],
                read: [],
              },
              ui: ['show'],
            },
          },
        });
      }

      // Add server routes and initialize the plugin here
      initApp(server);
    }
  });
}