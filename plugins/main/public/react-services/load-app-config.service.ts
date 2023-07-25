/*
 * Wazuh app - Load App config service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { GenericRequest } from './generic-request';
import store from '../redux/store';
import {
  setAppConfigIsLoading,
  setAppConfigHasError,
  updateAppConfig,
} from '../redux/actions/appConfigActions';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';

/**
 * Retunrs the wazuh app config
 */
export const loadAppConfig = async () => {
  try {
    store.dispatch(setAppConfigIsLoading());
    const config = await GenericRequest.request('GET', '/utils/configuration', {});

    if (!config || !config.data || !config.data.data) {
      throw new Error('No config available');
    }

    const ymlContent = config.data.data;
    store.dispatch(updateAppConfig(ymlContent));
  } catch (error) {
    store.dispatch(setAppConfigHasError());
    const options = {
      context: 'loadAppConfig',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Error parsing wazuh.yml, using default values.`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
};
