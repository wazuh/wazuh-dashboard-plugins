import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockSuccessResponse } from './mocks';
import { AvailableUpdates } from '../../../common/types';
import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { setSavedObject } from '../saved-object';
import { log } from '../../lib/logger';
import { getPlugins } from '../../plugin-services';

export const getUpdates = async (context, request, response): Promise<AvailableUpdates> => {
  const mock = new MockAdapter(axios);

  try {
    const updatesServiceUrl = `/api/updates`;

    const { wazuhCore } = await getPlugins();

    // const wazuhApiCtrl = new wazuhCore.WazuhApiCtrl();
    // request.body = {
    //   ...request.body,
    //   method:"GET",
    //   path:"/agents",
    //   id:"imposter"
    // }
    
    const wazuhHostsController = new wazuhCore.WazuhHostsCtrl();
    // const manageHosts = new wazuhCore.ManageHosts();
    // const hosts = await manageHosts.getHosts();
    const fakeResponseEndpoint = {
      ok: (body: any) => body,
      custom: (body: any) => body,
    };
    const hostsResponse: {body: []} = await wazuhHostsController.getHostsEntries(false, false, fakeResponseEndpoint);

    const data = request.body;
    const method = "GET";
    const path = "/agents";
    const options = {apiHostID: hostsResponse.body[0].id,
      forceRefresh:true
    };
    // Make a request for each API configured
    
    const apiResponse = await wazuhCore.wazuhApiClient.client.asInternalUser.request(method, path, data, options)

    mock.onGet(updatesServiceUrl).reply(200, mockSuccessResponse);

    const updatesResponse = await axios.get(updatesServiceUrl);

    const updates = updatesResponse?.data?.data || {};

    const updatesToSave = { ...updates, last_check: new Date() };

    await setSavedObject(SAVED_OBJECT_UPDATES, updatesToSave);

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
