/*
 * Wazuh app - Module to check cookie consistence
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from '../../react-services/app-state';

export async function checkTimestamp(genericReq, $location, wzMisc) {
  try {
    const data = await genericReq.request('GET', '/api/timestamp');
    const current = AppState.getCreatedAt();
    if (data && data.data) {
      if (!current) AppState.setCreatedAt(data.data.lastRestart);
      wzMisc.setLastRestart(data.data.lastRestart);
    } else {
      wzMisc.setBlankScr('Your wazuh-registry.json is empty or corrupt.');
      $location.search('tab', null);
      $location.path('/blank-screen');
    }
    return;
  } catch (error) {
    wzMisc.setBlankScr(error.message || error);
    $location.search('tab', null);
    $location.path('/blank-screen');
    throw error;
  }
}
