/*
 * Wazuh app - Module for Kibana plugin definition
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { resolve } from 'path';
import { WazuhPlugin } from './server/plugin';

export default (kibana) => {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],
    id: 'wazuh',
    name: 'wazuh',
    uiExports: {
      app: {
        id: 'wazuh',
        title: 'Wazuh',
        description: 'Wazuh app for Kibana',
        icon: 'plugins/wazuh/img/icon_blue.png',
        main: 'plugins/wazuh/app'
      },
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
        enabled: Joi.boolean().default(true)
      }).default();
    },

    init(server) {
      const coreSetup = server.newPlatform.setup.core;
      const pluginsSetup = {
        discover: server.newPlatform.setup.plugins.discover
      };
      const legacySetup = {
        server
      };

      new WazuhPlugin().setup(coreSetup, pluginsSetup, legacySetup);
    }
  });
}
