import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockSuccessResponse } from './mocks';
import { AvailableUpdates } from '../../../common/types';
import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { setSavedObject } from '../saved-object';
import { log } from '../../lib/logger';
import { getPlugins } from '../../plugin-services';

export const getUpdates = async () => {
  const mock = new MockAdapter(axios);

  try {
    const { wazuhCore } = await getPlugins();
    const wazuhHostsController = new wazuhCore.WazuhHostsCtrl();
    const configuration = new wazuhCore.getConfiguration();

    const hosts: [] = await wazuhHostsController.getHostsEntries();


    const updates = await Promise.all(hosts.map(async api => {
      const data = {};
      const method = "GET";
      const path = "/agents";
      const options = {
        apiHostID: api.id,
        forceRefresh: true
      };
      try {
        const response = await wazuhCore.wazuhApiClient.client.asInternalUser.request(method, path, data, options);
        return response.data.data.affected_items;
      } catch (error) {
        return { error }
      }
    }));

    const updatesToSave = { updates, last_check: new Date() };

    // await setSavedObject(SAVED_OBJECT_UPDATES, updatesToSave);

    return updatesToSave;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Error trying to get available updates';
    log('wazuh-check-updates:getUpdates', message);
    return Promise.reject(error);
  }
};
