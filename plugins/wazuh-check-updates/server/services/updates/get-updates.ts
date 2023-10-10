import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockSuccessResponse } from './mocks';
import {
  API_UPDATES_STATUS,
  AvailableUpdates,
  ResponseApiAvailableUpdates,
} from '../../../common/types';
import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { getSavedObject, setSavedObject } from '../saved-object';
import { log } from '../../lib/logger';
// import { getPlugins } from '../../plugin-services';

export const getUpdates = async (
  checkAvailableUpdates?: boolean,
): Promise<AvailableUpdates> => {
  const mock = new MockAdapter(axios);

  try {
    // const { wazuhCore } = await getPlugins();
    // const wazuhHostsController = new wazuhCore.WazuhHostsCtrl();

    // const hosts: [] = await wazuhHostsController.getHostsEntries();

    // const updates = await Promise.all(hosts.map(async api => {
    //   const data = {};
    //   const method = "GET";
    //   const path = "/agents";
    //   const options = {
    //     apiHostID: api.id,
    //     forceRefresh: true
    //   };
    //   try {
    //     const response = await wazuhCore.wazuhApiClient.client.asInternalUser.request(method, path, data, options);
    //     return response.data.data.affected_items;
    //   } catch (error) {
    //     return { error }
    //   }
    // }));

    // const updatesToSave = { updates, last_check: new Date() };

    // await setSavedObject(SAVED_OBJECT_UPDATES, updatesToSave);
    // const updates = (updatesResponse?.data?.data || []) as ResponseApiAvailableUpdates[];

    if (!checkAvailableUpdates) {
      const availableUpdates = (await getSavedObject(
        SAVED_OBJECT_UPDATES,
      )) as AvailableUpdates;

      return availableUpdates;
    }

    const updatesServiceUrl = `/api/updates`;

    mock.onGet(updatesServiceUrl).reply(200, mockSuccessResponse);

    const updatesResponse = await axios.get(updatesServiceUrl);

    const updates = (updatesResponse?.data?.data ||
      []) as ResponseApiAvailableUpdates[];

    const apisAvailableUpdates = updates?.map(update => {
      const status =
        update.last_available_patch ||
        update.last_available_minor ||
        update.last_available_patch
          ? API_UPDATES_STATUS.AVAILABLE_UPDATES
          : API_UPDATES_STATUS.UP_TO_DATE;

      return {
        ...update,
        status,
      };
    });

    const savedObject = {
      apis_available_updates: apisAvailableUpdates,
      last_check_date: new Date().toString(),
    };

    await setSavedObject(SAVED_OBJECT_UPDATES, savedObject);

    return savedObject;
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
