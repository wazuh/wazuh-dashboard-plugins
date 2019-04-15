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
import needle from 'needle';
import colors from 'ansicolors';
import { log } from './logger';
import { ElasticWrapper } from './lib/elastic-wrapper';
import packageJSON from '../package.json';
import { kibanaTemplate } from './integration-files/kibana-template';
import { getConfiguration } from './lib/get-configuration';
import { defaultExt } from './lib/default-ext';
import { BuildBody } from './lib/replicas-shards-helper';
import { checkKnownFields } from './lib/refresh-known-fields';

export function Initialize(server) {
  const blueWazuh = colors.blue('wazuh');

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

  const defaultIndexPattern = pattern || 'wazuh-alerts-3.x-*';

  // Save Wazuh App setup
  const saveConfiguration = async () => {
    try {
      const shardConfiguration = BuildBody(configurationFile, 'wazuh-version');

      await wzWrapper.createWazuhVersionIndex(shardConfiguration);

      const commonDate = new Date().toISOString();

      const configuration = {
        name: 'Wazuh App',
        'app-version': packageJSON.version,
        revision: packageJSON.revision,
        installationDate: commonDate,
        lastRestart: commonDate
      };

      try {
        await wzWrapper.insertWazuhVersionConfiguration(configuration);

        log(
          'initialize:saveConfiguration',
          'Wazuh configuration inserted',
          'debug'
        );
      } catch (error) {
        log('initialize:saveConfiguration', error.message || error);
        server.log(
          [blueWazuh, 'initialize', 'error'],
          'Could not insert Wazuh configuration'
        );
      }

      return;
    } catch (error) {
      log('initialize:saveConfiguration', error.message || error);
      server.log(
        [blueWazuh, 'initialize', 'error'],
        'Error creating index .wazuh-version.'
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

      if (((apiEntries || {}).hits || {}).total > 0) {
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

        // The .wazuh index exists, we now proceed to check whether it's from an older version
        try {
          await wzWrapper.getOldWazuhSetup();

          // Reindex!
          return reindexOldVersion();
        } catch (error) {
          if (error.message && error.message !== 'Not Found') {
            throw new Error(error.message || error);
          }
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const checkWazuhVersionIndex = async () => {
    try {
      log(
        'initialize[checkWazuhVersionIndex]',
        'Checking .wazuh-version index.',
        'debug'
      );

      try {
        await wzWrapper.getWazuhVersionIndex();
        const shardConfiguration = BuildBody(
          configurationFile,
          'wazuh-version'
        );
        await wzWrapper.updateIndexSettings(
          '.wazuh-version',
          shardConfiguration
        );
      } catch (error) {
        log(
          'initialize[checkWazuhVersionIndex]',
          '.wazuh-version document does not exist. Initializating configuration...',
          'debug'
        );

        // Save Setup Info
        await saveConfiguration(defaultIndexPattern);
      }

      await wzWrapper.updateWazuhVersionIndexLastRestart(
        packageJSON.version,
        packageJSON.revision
      );
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Init function. Check for "wazuh-version" document existance.
  const init = async () => {
    try {
      await Promise.all([
        checkWazuhIndex(),
        checkWazuhVersionIndex(),
        checkKnownFields(wzWrapper, log, server, defaultIndexPattern)
      ]);
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
        `No need to create the ${
          wzWrapper.WZ_KIBANA_INDEX
        } template, already exists.`,
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

  const updateClusterInformation = async config => {
    try {
      await wzWrapper.updateWazuhIndexDocument(null, config.id, {
        doc: {
          api_user: config.api_user,
          api_password: config.api_password,
          url: config.url,
          api_port: config.api_port,
          manager: config.manager,
          cluster_info: {
            manager: config.manager,
            node: config.cluster_info.node,
            cluster: config.cluster_info.cluster,
            status: config.cluster_info.status
          }
        }
      });

      log(
        'initialize:updateClusterInformation',
        `Successfully updated proper cluster information for ${config.manager}`,
        'debug'
      );

      return;
    } catch (error) {
      return Promise.reject(
        new Error(
          `Could not update proper cluster information for ${
            config.manager
          } due to ${error.message || error}`
        )
      );
    }
  };

  const updateSingleHostInformation = async config => {
    try {
      await wzWrapper.updateWazuhIndexDocument(null, config.id, {
        doc: {
          api_user: config.api_user,
          api_password: config.api_password,
          url: config.url,
          api_port: config.api_port,
          manager: config.manager,
          cluster_info: {
            manager: config.manager,
            node: 'nodata',
            cluster: 'nodata',
            status: 'disabled'
          }
        }
      });

      log(
        'initialize:updateSingleHostInformation',
        `Successfully updated proper single host information for ${
          config.manager
        }`,
        'debug'
      );

      return;
    } catch (error) {
      return Promise.reject(
        new Error(
          `Could not update proper single host information for ${
            config.manager
          } due to ${error.message || error}`
        )
      );
    }
  };

  const getNodeInformation = async config => {
    try {
      const response = await needle(
        'get',
        `${config.url}:${config.api_port}/cluster/node`,
        {},
        {
          headers: {
            'wazuh-app-version': packageJSON.version
          },
          username: config.api_user,
          password: Buffer.from(config.api_password, 'base64').toString(
            'ascii'
          ),
          rejectUnauthorized: !config.insecure
        }
      );

      if (!response.body.error) {
        config.cluster_info = {};
        config.cluster_info.status = 'enabled';
        config.cluster_info.manager = config.manager;
        config.cluster_info.node = response.body.data.node;
        config.cluster_info.cluster = response.body.data.cluster;
      } else if (response.body.error) {
        log(
          'initialize:getNodeInformation',
          `Could not get cluster/node information for ${
            config.manager
          } due to ${response.body.error || response.body}`
        );
        server.log(
          [blueWazuh, 'reindex', 'error'],
          `Could not get cluster/node information for ${config.manager}`
        );
      }

      return;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const getClusterStatus = async config => {
    try {
      const response = await needle(
        'get',
        `${config.url}:${config.api_port}/cluster/status`,
        {},
        {
          // Checking the cluster status
          headers: {
            'wazuh-app-version': packageJSON.version
          },
          username: config.api_user,
          password: Buffer.from(config.api_password, 'base64').toString(
            'ascii'
          ),
          rejectUnauthorized: !config.insecure
        }
      );

      if (!response.body.error) {
        if (response.body.data.enabled === 'yes') {
          // If cluster mode is active
          return getNodeInformation(config);
        } else {
          // Cluster mode is not active
          config.cluster_info = {};
          config.cluster_info.status = 'disabled';
          config.cluster_info.cluster = 'Disabled';
          config.cluster_info.manager = config.manager;
        }

        // We filled data for the API, let's insert it now
        return updateClusterInformation(config);
      } else {
        log(
          'initialize:getClusterStatus',
          `Could not get cluster/status information for ${config.manager}`
        );
        server.log(
          [blueWazuh, 'reindex', 'error'],
          `Could not get cluster/status information for ${config.manager}`
        );
        return;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const checkVersion = async config => {
    try {
      const response = await needle(
        'get',
        `${config.url}:${config.api_port}/version`,
        {},
        {
          headers: {
            'wazuh-app-version': packageJSON.version
          },
          username: config.api_user,
          password: Buffer.from(config.api_password, 'base64').toString(
            'ascii'
          ),
          rejectUnauthorized: !config.insecure
        }
      );

      log(
        'initialize:checkVersion',
        `API is reachable ${config.manager}`,
        'debug'
      );

      if (parseInt(response.body.error) === 0 && response.body.data) {
        return getClusterStatus(config);
      } else {
        log(
          'initialize:checkVersion',
          `The API responded with some kind of error for ${config.manager}`
        );
        server.log(
          [blueWazuh, 'reindex', 'error'],
          `The API responded with some kind of error for ${config.manager}`
        );
        return;
      }
    } catch (error) {
      log(
        'initialize:checkVersion',
        `API is NOT reachable ${config.manager} due to ${error.message ||
          error}`
      );
      server.log(
        [blueWazuh, 'reindex', 'info'],
        `API is NOT reachable ${config.manager}`
      );
      // We weren't able to reach the API, reorganize data and fill with sample node and cluster name information
      return updateSingleHostInformation(config);
    }
  };

  const reachAPI = async config => {
    try {
      const id = config._id;
      config = config._source;
      config.id = id;
      log('initialize:reachAPI', `Reaching ${config.manager}`, 'debug');
      server.log([blueWazuh, 'reindex', 'info'], `Reaching ${config.manager}`);

      if (config.cluster_info === undefined) {
        // No cluster_info in the API configuration data -> 2.x version
        await checkVersion(config);
      } else {
        // 3.x version
        // Nothing to be done, cluster_info is present
        log(
          'initialize:reachAPI',
          `Nothing to be done for ${
            config.manager
          } as it is already a 3.x version.`,
          'debug'
        );
      }

      return;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Reindex a .wazuh index from 2.x-5.x or 3.x-5.x to .wazuh and .wazuh-version in 3.x-6.x
  const reindexOldVersion = async () => {
    try {
      log(
        'initialize:reindexOldVersion',
        `Old version detected. Proceeding to reindex.`,
        'debug'
      );

      const configuration = {
        source: {
          index: '.wazuh',
          type: 'wazuh-configuration'
        },
        dest: {
          index: '.old-wazuh'
        }
      };

      // Backing up .wazuh index
      await wzWrapper.reindexWithCustomConfiguration(configuration);

      log(
        'initialize:reindexOldVersion',
        'Successfully backed up .wazuh index',
        'debug'
      );

      // And...this response does not take into acount new index population so...let's wait for it
      setTimeout(() => swapIndex(), 3000);
    } catch (error) {
      log(
        'initialize:reindexOldVersion',
        `Could not begin the reindex process due to ${error.message || error}`
      );
      server.log(
        [blueWazuh, 'reindex', 'error'],
        `Could not begin the reindex process due to ${error.message || error}`
      );
    }
  };

  const swapIndex = async () => {
    try {
      // Deleting old .wazuh index
      log('initialize:swapIndex', 'Deleting old .wazuh index', 'debug');

      await wzWrapper.deleteIndexByName('.wazuh');

      const configuration = {
        source: {
          index: '.old-wazuh',
          type: 'wazuh-configuration'
        },
        dest: {
          index: '.wazuh'
        },
        script: {
          source: 'ctx._id = new Date().getTime()',
          lang: 'painless'
        }
      };

      log('initialize:swapIndex', 'Reindexing into the new .wazuh', 'debug');

      // Reindexing from .old-wazuh where the type of document is wazuh-configuration into the new index .wazuh
      await wzWrapper.reindexWithCustomConfiguration(configuration);

      // Now we need to properly replace the cluster_info into the configuration -> improvement: pagination?
      // And...this response does not take into acount new index population so...let's wait for it
      setTimeout(() => reachAPIs(), 3000);
    } catch (error) {
      log(
        'initialize:swapIndex',
        `Could not reindex the new .wazuh due to ${error.message || error}`
      );
      server.log(
        [blueWazuh, 'reindex', 'error'],
        `Could not reindex the new .wazuh due to ${error.message || error}`
      );
    }
  };

  const reachAPIs = async () => {
    try {
      const data = await wzWrapper.searchIndexByName('.wazuh');
      const promises = [];
      for (let item of data.hits.hits) {
        promises.push(reachAPI(item));
      }
      await Promise.all(promises);
    } catch (error) {
      log(
        'initialize[reachAPIs]',
        `Something happened while getting old API configuration data due to ${error.message ||
          error}`
      );
      server.log(
        [blueWazuh, 'reindex', 'error'],
        `Something happened while getting old API configuration data due to ${error.message ||
          error}`
      );
    }
  };

  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  checkStatus();
}
