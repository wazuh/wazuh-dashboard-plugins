/*
 * Wazuh app - Error handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import store from '../redux/store';
import { updateWazuhNotReadyYet } from '../redux/actions/appStateActions';
import { WzRequest } from './wz-request';
import { delayAsPromise } from '../../common/utils';

let busy = false;

export class CheckDaemonsStatus {
  static async makePing(tries = 10) {
    try {
      if (busy) return;

      busy = true;

      let isValid = false;
      while (tries--) {
        await delayAsPromise(1200);
        const result = await WzRequest.apiReq('GET', '/ping', {});
        isValid = ((result || {}).data || {}).isValid;
        if (isValid) {
          const updateNotReadyYet = updateWazuhNotReadyYet(false);
          store.dispatch(updateNotReadyYet);
          break;
        }
      }

      if (!isValid) {
        throw new Error('Not recovered');
      }
    } catch (error) {
      store.dispatch(updateWazuhNotReadyYet('Wazuh could not be recovered.'));
      throw error;
    }
    busy = false;
  }
}
