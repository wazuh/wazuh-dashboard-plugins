/*
 * Wazuh app - App Config Reducer
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { Reducer } from 'redux';
import { getSettingsDefault } from '../../../common/services/settings';
import { AppConfigState, ResolverAction } from '../types';

const initialState: AppConfigState = {
  isLoading: false,
  isReady: false,
  hasError: false,
  data: getSettingsDefault(),
};

const appConfigReducer: Reducer<AppConfigState, ResolverAction> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case 'UPDATE_APP_CONFIG_SET_IS_LOADING':
      return {
        ...state,
        isLoading: true,
        isReady: false,
        hasError: false
      };
    case 'UPDATE_APP_CONFIG_SET_HAS_ERROR':
          return {
            ...state,
            isLoading: false,
            isReady: false,
            hasError: true
          };
    case 'UPDATE_APP_CONFIG_DATA':
      return {
        ...state,
        isLoading: false,
        isReady: true,
        hasError: false,
        data: {...state.data, ...action.payload},
      };
    default:
      return state;
  }
};

export default appConfigReducer;
