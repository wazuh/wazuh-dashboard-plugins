/*
 * Wazuh app - Module for app initialization
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { checkKnownFields } from './lib/refresh-known-fields';
import { totalmem } from 'os';
import fs from 'fs';
import { ManageHosts } from './lib/manage-hosts';
import { UpdateRegistry } from './lib/update-registry';
import { WAZUH_ALERTS_PATTERN } from '../util/constants';
import path from 'path';

const manageHosts = new ManageHosts();
const registry = new UpdateRegistry()
const wazuhRegistry = registry.file;

const OPTIMIZE_WAZUH_PATH = '../../../optimize/wazuh';

export function Initialize(server) {
  const blueWazuh = '\u001b[34mwazuh\u001b[39m';
  const initializeErrorLogColors = [blueWazuh, 'initialize', 'error'];
  // Elastic JS Client
  const wzWrapper = new ElasticWrapper(server);
  log('initialize', `Kibana index: ${wzWrapper.WZ_KIBANA_INDEX}`, 'info');
  log('initialize', `App revision: ${packageJSON.revision}`, 'info');

  let configurationFile = {};
  let pattern = null;
  // Read config from package.json and wazuh.yml
  try {
    configurationFile = getConfiguration();

    pattern =
      configurationFile && typeof configurationFile.pattern !== 'undefined'
        ? configurationFile.pattern
        : WAZUH_ALERTS_PATTERN;
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

  const defaultIndexPattern = pattern || WAZUH_ALERTS_PATTERN;

  // Save Wazuh App setup
  const saveConfiguration = async () => {
    try {
      const commonDate = new Date().toISOString();

      const configuration = {
        name: 'Wazuh App',
        'app-version': packageJSON.version,
        revision: packageJSON.revision,
        installationDate: commonDate,
        lastRestart: commonDate,
        hosts: {}
      };
      try {
        if (!fs.existsSync(path.join(__dirname, OPTIMIZE_WAZUH_PATH))) {
          fs.mkdirSync(path.join(__dirname, OPTIMIZE_WAZUH_PATH));
        }
        if (!fs.existsSync(path.join(__dirname, `${OPTIMIZE_WAZUH_PATH}/config`))) {
          fs.mkdirSync(path.join(__dirname, `${OPTIMIZE_WAZUH_PATH}/config`));
        }
        await fs.writeFileSync(wazuhRegistry, JSON.stringify(configuration), 'utf8', err => {
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
   * Checks if the .wazuh index exist in order to migrate to wazuh.yml
   */
  const checkWazuhIndex = async () => {
    try {
      log('initialize:checkWazuhIndex', 'Checking .wazuh index.', 'debug');

      const result = await wzWrapper.checkIfIndexExists('.wazuh');

      if (result) {
        try {
          const data = await wzWrapper.getWazuhAPIEntries();
          const apiEntries = ((data || {}).hits || {}).hits || [];
          await manageHosts.migrateFromIndex(apiEntries);
          log(
            'initialize:checkWazuhIndex',
            'Index .wazuh will be removed and its content will be migrated to wazuh.yml',
            'debug'
          );
          // Check if all APIs entries were migrated properly and delete it from the .wazuh index
          await checkProperlyMigrate();
          await wzWrapper.deleteIndexByName('.wazuh');
        } catch (error) {
          throw new Error(error);
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  /**
   * Checks if the API entries were properly migrated
   * @param {Array} migratedApis
   */
  const checkProperlyMigrate = async () => {
    try {
      let apisIndex = await wzWrapper.getWazuhAPIEntries();
      const hosts = await manageHosts.getHosts();
      apisIndex = (apisIndex.hits || {}).hits || [];

      const apisIndexKeys = apisIndex.map(api => {
        return api._id;
      });
      const hostsKeys = hosts.map(api => {
        return Object.keys(api)[0];
      });

      // Get into an array the API entries that were not migrated, if the length is 0 then all the API entries were properly migrated.
      const rest = apisIndexKeys.filter(k => {
        return !hostsKeys.includes(k);
      });

      if (rest.length) {
        throw new Error(
          `Cannot migrate all API entries, missed entries: (${rest.toString()})`
        );
      }
      log(
        'initialize:checkProperlyMigrate',
        'The API entries migration was successful',
        'debug'
      );
    } catch (error) {
      log('initialize:checkProperlyMigrate', `${error}`, 'error');
      return Promise.reject(error);
    }
  };

  /**
   * Checks if the .wazuh-version exists, in this case it will be deleted and the wazuh-registry.json will be created
   */
  const checkWazuhRegistry = async () => {
    try {
      log(
        'initialize[checkwazuhRegistry]',
        'Checking wazuh-version registry.',
        'debug'
      );
      try {
        await wzWrapper.deleteWazuhVersionIndex();
        log(
          'initialize[checkwazuhRegistry]',
          'Successfully deleted old .wazuh-version index.',
          'debug'
        );
      } catch (error) {
        log(
          'initialize[checkwazuhRegistry]',
          'No need to delete old .wazuh-version index',
          'debug'
        );
      }

      if (!fs.existsSync(wazuhRegistry)) {
        log(
          'initialize[checkwazuhRegistry]',
          'wazuh-version registry does not exist. Initializing configuration.',
          'debug'
        );

        // Create the app registry file for the very first time
        saveConfiguration();
      } else {
        // If this function fails, it throws an exception
        const source = JSON.parse(fs.readFileSync(wazuhRegistry, 'utf8'));

        // Check if the stored revision differs from the package.json revision
        const isUpgradedApp = packageJSON.revision !== source.revision || packageJSON.version !== source['app-version'];

        // Rebuild the registry file if revision or version fields are differents
        if (isUpgradedApp) { 
          log(
            'initialize[checkwazuhRegistry]',
            'Wazuh app revision or version changed, regenerating wazuh-version registry',
            'info'
          );
          // Rebuild registry file in blank
          saveConfiguration();
        }
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
        checkWazuhRegistry(),
        checkKnownFields(wzWrapper, log, server, defaultIndexPattern)
      ]);
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
