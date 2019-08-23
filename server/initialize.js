/*
 * Wazuh app - Module for app initialization
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { log } from './logger';
import { ElasticWrapper } from './lib/elastic-wrapper';
import packageJSON from '../package.json';
import { kibanaTemplate } from './integration-files/kibana-template';
import { getConfiguration } from './lib/get-configuration';
import { defaultExt } from './lib/default-ext';
import { BuildBody } from './lib/replicas-shards-helper';
import { checkKnownFields } from './lib/refresh-known-fields';
import { totalmem } from 'os';
import fs from 'fs';
import path from 'path';

export function Initialize(server) {
  const wazuhVersion = path.join(__dirname, '/wazuh-version.json');
  const blueWazuh = '\u001b[34mwazuh\u001b[39m';
  const initializeErrorLogColors = [blueWazuh, 'initialize', 'error'];
  // Elastic JS Client
  const wzWrapper = new ElasticWrapper(server);
  log('initialize', `Kibana index: ${wzWrapper.WZ_KIBANA_INDEX}`, 'info');
  log('initialize', `App revision: ${packageJSON.revision}`, 'info');

  let configurationFile = {};
  let pattern = null;
  // Read config from package.json and config.yml
  try {
    configurationFile = getConfiguration();

    pattern =
      configurationFile && typeof configurationFile.pattern !== 'undefined'
        ? configurationFile.pattern
        : 'wazuh-alerts-3.x-*';
    global.XPACK_RBAC_ENABLED =
      configurationFile &&
      typeof configurationFile['xpack.rbac.enabled'] !== 'undefined'
        ? configurationFile['xpack.rbac.enabled']
        : true;
  } catch (e) {
    log('initialize', e.message || e);
    server.log(
      initializeErrorLogColors,
      'Something went wrong while reading the configuration.' + e.message
    );
  }

  try {
    // RAM in MB
    const ram = Math.ceil(totalmem() / 1024 / 1024);
    log('initialize', `Total RAM: ${ram}MB`, 'info');
  } catch (error) {
    log(
      'initialize',
      `Could not check total RAM due to: ${error.message || error}`
    );
  }

  const defaultIndexPattern = pattern || 'wazuh-alerts-3.x-*';

  // Save Wazuh App setup
  const saveConfiguration = () => {
    try {
      const commonDate = new Date().toISOString();

      const configuration = {
        name: 'Wazuh App',
        'app-version': packageJSON.version,
        revision: packageJSON.revision,
        installationDate: commonDate,
        lastRestart: commonDate
      };

      try {
        fs.writeFileSync(wazuhVersion, JSON.stringify(configuration), err => {
          if (err) {
            throw new Error(err);
          }
        });
        log(
          'initialize:saveConfiguration',
          'Wazuh configuration registry inserted',
          'debug'
        );
      } catch (error) {
        log('initialize:saveConfiguration', error.message || error);
        server.log(
          initializeErrorLogColors,
          'Could not create Wazuh configuration registry'
        );
      }

      return;
    } catch (error) {
      log('initialize:saveConfiguration', error.message || error);
      server.log(
        initializeErrorLogColors,
        'Error creating wazuh-version registry'
      );
    }
  };

  /**
   * Checks for new extensions added to the config.yml,
   * useful whenever a new extension is added and it's enabled by default.
   * An old app package needs to update its stored API entries, this way we have consistency
   * with the new extensions.
   */
  const checkAPIEntriesExtensions = async () => {
    try {
      log(
        'initialize:checkAPIEntriesExtensions',
        `Checking extensions consistency for all API entries`,
        'debug'
      );

      const apiEntries = await wzWrapper.getWazuhAPIEntries();
      const configFile = await getConfiguration();

      if ((((apiEntries || {}).hits || {}).total || {}).value > 0) {
        const currentExtensions = !configFile ? defaultExt : {};

        if (configFile) {
          for (const key in defaultExt) {
            currentExtensions[key] =
              typeof configFile['extensions.' + key] !== 'undefined'
                ? configFile['extensions.' + key]
                : defaultExt[key];
          }
        }

        for (const item of apiEntries.hits.hits) {
          for (const key in currentExtensions) {
            if ((((item || {})._source || {}).extensions || {})[key]) {
              continue;
            } else {
              if (((item || {})._source || {}).extensions) {
                item._source.extensions[key] = currentExtensions[key];
              }
            }
          }
          try {
            await wzWrapper.updateWazuhIndexDocument(null, item._id, {
              doc: { extensions: item._source.extensions }
            });
            log(
              'initialize:checkAPIEntriesExtensions',
              `Successfully updated API entry extensions with ID: ${item._id}`,
              'debug'
            );
          } catch (error) {
            log(
              'initialize:checkAPIEntriesExtensions',
              `Error updating API entry extensions with ID: ${
                item._id
              } due to ${error.message || error}`
            );
            server.log(
              initializeErrorLogColors,
              `Error updating API entry extensions with ID: ${
                item._id
              } due to ${error.message || error}`
            );
          }
        }
      } else {
        log(
          'initialize:checkAPIEntriesExtensions',
          'There are no API entries, skipping extensions check',
          'debug'
        );
      }

      return;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const checkWazuhIndex = async () => {
    try {
      log('initialize:checkWazuhIndex', 'Checking .wazuh index.', 'debug');

      const result = await wzWrapper.checkIfIndexExists('.wazuh');

      const shardConfiguration = BuildBody(configurationFile, 'wazuh');

      if (!result) {
        try {
          await wzWrapper.createWazuhIndex(shardConfiguration);

          log('initialize:checkWazuhIndex', 'Index .wazuh created.', 'debug');
        } catch (error) {
          throw new Error('Error creating index .wazuh.');
        }
      } else {
        await wzWrapper.updateIndexSettings('.wazuh', shardConfiguration);
        await checkAPIEntriesExtensions();
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const checkWazuhVersionRegistry = async () => {
    try {
      log(
        'initialize[checkWazuhVersionRegistry]',
        'Checking wazuh-version registry.',
        'debug'
      );
      try {
        await wzWrapper.deleteWazuhVersionIndex();
        log(
          'initialize[checkWazuhVersionRegistry]',
          'Successfully deleted old .wazuh-version index.',
          'debug'
        );
      } catch (error) {
        log(
          'initialize[checkWazuhVersionRegistry]',
          'No need to delete old .wazuh-version index',
          'debug'
        );
      }

      if (!fs.existsSync(wazuhVersion)) {
        log(
          'initialize[checkWazuhVersionRegistry]',
          'wazuh-version registry does not exist. Initializing configuration.',
          'debug'
        );

        // Create the app registry file for the very first time
        saveConfiguration();
      } else {
        // App registry file exists, just update it
        const currentDate = new Date().toISOString();

        // If this function fails, it throws an exception
        const source = JSON.parse(fs.readFileSync(wazuhVersion, 'utf8'));

        // Check if the stored revision differs from the package.json revision
        const isNewApp = packageJSON.revision !== source.revision;

        // If it's an app with a different revision, it's a new installation
        source['installationDate'] = isNewApp
          ? currentDate
          : source['installationDate'];

        source['app-version'] = packageJSON.version;
        source.revision = packageJSON.revision;
        source.lastRestart = currentDate;

        // If this function fails, it throws an exception
        fs.writeFileSync(wazuhVersion, JSON.stringify(source), 'utf-8');
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Init function. Check for "wazuh-version" document existance.
  const init = async () => {
    try {
      await Promise.all([
        checkWazuhIndex(),
        checkWazuhVersionRegistry(),
        checkKnownFields(wzWrapper, log, server, defaultIndexPattern)
      ]);
      const reindexResult = await wzWrapper.reindexAppIndices();
      Array.isArray(reindexResult) &&
        reindexResult.length === 2 &&
        log(
          'initialize:init',
          `${reindexResult[0].value} (${reindexResult[0].result}) / ${reindexResult[1].value} (${reindexResult[1].result})`,
          'debug'
        );
    } catch (error) {
      log('initialize:init', error.message || error);
      server.log(initializeErrorLogColors, error.message || error);
      return Promise.reject(error);
    }
  };

  const createKibanaTemplate = () => {
    log(
      'initialize:createKibanaTemplate',
      `Creating template for ${wzWrapper.WZ_KIBANA_INDEX}`,
      'debug'
    );

    try {
      kibanaTemplate.template = wzWrapper.WZ_KIBANA_INDEX + '*';
    } catch (error) {
      log('initialize:createKibanaTemplate', error.message || error);
      server.log(
        initializeErrorLogColors,
        'Exception: ' + error.message || error
      );
    }

    return wzWrapper.putWazuhKibanaTemplate(kibanaTemplate);
  };

  const createEmptyKibanaIndex = async () => {
    try {
      await wzWrapper.createEmptyKibanaIndex();
      log(
        'initialize:checkKibanaStatus',
        `Successfully created ${wzWrapper.WZ_KIBANA_INDEX} index.`,
        'debug'
      );
      await init();
      return;
    } catch (error) {
      return Promise.reject(
        new Error(
          `Error creating ${
            wzWrapper.WZ_KIBANA_INDEX
          } index due to ${error.message || error}`
        )
      );
    }
  };

  const fixKibanaTemplate = async () => {
    try {
      await createKibanaTemplate();
      log(
        'initialize:checkKibanaStatus',
        `Successfully created ${wzWrapper.WZ_KIBANA_INDEX} template.`,
        'debug'
      );
      await createEmptyKibanaIndex();
      return;
    } catch (error) {
      return Promise.reject(
        new Error(
          `Error creating template for ${
            wzWrapper.WZ_KIBANA_INDEX
          } due to ${error.message || error}`
        )
      );
    }
  };

  const getTemplateByName = async () => {
    try {
      await wzWrapper.getTemplateByName('wazuh-kibana');
      log(
        'initialize:checkKibanaStatus',
        `No need to create the ${wzWrapper.WZ_KIBANA_INDEX} template, already exists.`,
        'debug'
      );
      await createEmptyKibanaIndex();
      return;
    } catch (error) {
      log('initialize:checkKibanaStatus', error.message || error);
      return fixKibanaTemplate();
    }
  };

  // Does Kibana index exist?
  const checkKibanaStatus = async () => {
    try {
      const data = await wzWrapper.checkIfIndexExists(
        wzWrapper.WZ_KIBANA_INDEX
      );
      if (data) {
        // It exists, initialize!
        await init();
      } else {
        // No Kibana index created...
        log(
          'initialize:checkKibanaStatus',
          "Didn't find " + wzWrapper.WZ_KIBANA_INDEX + ' index...',
          'info'
        );
        await getTemplateByName();
      }
    } catch (error) {
      log('initialize:checkKibanaStatus', error.message || error);
      server.log(initializeErrorLogColors, error.message || error);
    }
  };

  // Wait until Elasticsearch js is ready
  const checkStatus = async () => {
    try {
      await server.plugins.elasticsearch.waitUntilReady();
      return checkKibanaStatus();
    } catch (error) {
      log(
        'initialize:checkStatus',
        'Waiting for elasticsearch plugin to be ready...',
        'debug'
      );
      setTimeout(() => checkStatus(), 3000);
    }
  };

  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  checkStatus();
}
