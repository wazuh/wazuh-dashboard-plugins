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
import { UpdateConfigurationFile } from './lib/update-configuration';
const updateConfigurationFile = new UpdateConfigurationFile();

export function Initialize(server) {
  const wazuhRegistry = path.join(__dirname, '/wazuh-registry.json');
  const blueWazuh = '\u001b[34mwazuh\u001b[39m';
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
      [blueWazuh, 'initialize', 'error'],
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
  const saveConfiguration = async () => {
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
        fs.writeFileSync(wazuhRegistry, JSON.stringify(configuration), (err) => {
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
          [blueWazuh, 'initialize', 'error'],
          'Could not create Wazuh configuration registry'
        );
      }

      return;
    } catch (error) {
      log('initialize:saveConfiguration', error.message || error);
      server.log(
        [blueWazuh, 'initialize', 'error'],
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
              [blueWazuh, 'initialize:checkAPIEntriesExtensions', 'error'],
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
      log('initialize:checkWazuhIndex', 'Checking if .wazuh index exists.', 'debug');

      const result = await wzWrapper.checkIfIndexExists('.wazuh');
      if (result) {
        try {
          const data = await wzWrapper.getWazuhAPIEntries();
          const apiEntries = (((data || {}).hits || {}).hits || []);
          await updateConfigurationFile.migrateFromIndex(apiEntries)
          log('initialize:checkWazuhIndex', 'Index .wazuh will be removed and its content will be migrated to config.yml', 'debug');
          // Check if all APIs entries were migrated properly and delete it from the .wazuh index
          const apisToDelete = await checkProperlyMigrate();
          if (apisToDelete.length){
            apisToDelete.map(async id => {
              await wzWrapper.deleteWazuhAPIEntriesWithRequest({'params': {'id': id}});
            });            
          } else {
            throw new Error('Cannot migrate all APIs from .wazuh index to the config.yml file properly.');
          }
          log('initialize:checkWazuhIndex', 'Content of index .wazuh deleted.', 'debug');
        } catch (error) {
          throw new Error('Error deleting index .wazuh. ' + error);
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Checks if all the APIs were migrated
  const checkProperlyMigrate = async () => {
    let apisIndex = await wzWrapper.getWazuhAPIEntries();
    let apisConfig = await updateConfigurationFile.getHosts();
    apisIndex = (apisIndex.hits || {}).hits || [];

    const apisIndexKeys = apisIndex.map(api => {
      return api._id;
    });

    const apisConfigKeys = apisConfig.map(api => {
      return Object.keys(api)[0];
    });

    apisIndexKeys.map(k => {
      if (!apisConfigKeys.includes(k)) throw new Error('Cannot migrate all the APIs entries.');
    });
    return apisIndexKeys;
  }

  const checkWazuhRegistry = async () => {
    try {
      log(
        'initialize[checkWazuhRegistry]',
        'Checking wazuh-version registry.',
        'debug'
      );
      try {
        await wzWrapper.deletewazuhRegistryIndex();
        log(
          'initialize[checkWazuhRegistry]',
          'Successfully deleted old .wazuh-version index.',
          'debug'
        );
      } catch (error) {
        log(
          'initialize[checkWazuhRegistry]',
          'No need to delete old .wazuh-version index',
          'debug'
        );
      }

      try {
        if (!fs.existsSync(wazuhRegistry)) {
          throw new Error;
        }
      } catch (error) {
        log(
          'initialize[checkWazuhRegistry]',
          'wazuh-version registry does not exist. Initializating configuration...',
          'debug'
        );

        // Save Setup Info
        await saveConfiguration();
      }

      let source = JSON.parse(fs.readFileSync(wazuhRegistry, 'utf8'));
      source['app-version'] = packageJSON.version;
      source.revision = packageJSON.revision;
      source.lastRestart = new Date().toISOString(); // Registry exists so we update the lastRestarted date only

      /*       fs.writeFileSync(wazuhRegistry, JSON.stringify(source), (err) => {
              if (err) {
                throw new Error(err);
              }
            }); */
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Init function. Check for "wazuh-version" document existance.
  const init = async () => {
    try {
      await Promise.all([
        checkWazuhIndex(),
        checkWazuhRegistry(),
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
      server.log(
        [blueWazuh, 'initialize:init', 'error'],
        error.message || error
      );
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
        [blueWazuh, 'initialize', 'error'],
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
        server.log(
          [blueWazuh, 'initialize', 'info'],
          "Didn't find " + wzWrapper.WZ_KIBANA_INDEX + ' index...'
        );
        await getTemplateByName();
      }
    } catch (error) {
      log('initialize:checkKibanaStatus', error.message || error);
      server.log(
        [blueWazuh, 'initialize (checkKibanaStatus)', 'error'],
        error.message || error
      );
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
