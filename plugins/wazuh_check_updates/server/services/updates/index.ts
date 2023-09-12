import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockSuccessResponse } from './mocks';
import { AvailableUpdates } from '../../../common/types';
import { setSavedObject } from '..';
import { SAVED_OBJECT_UPDATES } from '../../../common';

export const getUpdates = async (): Promise<AvailableUpdates | undefined> => {
  const mock = new MockAdapter(axios);

  try {
    console.log('Checking Wazuh available updates...');

    const updatesServiceUrl = `/api/updates`;

    mock.onGet(updatesServiceUrl).reply(200, mockSuccessResponse);

    const updatesResponse = await axios.get(updatesServiceUrl, {
      method: 'GET',
    });

    const updates = updatesResponse?.data?.data || {};

    setSavedObject(SAVED_OBJECT_UPDATES, { ...updates, last_check: new Date() });
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:getUpdates', message);
    return Promise.reject(error);
  }
};
