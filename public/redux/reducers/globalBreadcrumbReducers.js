/*
 * Wazuh app - App State Reducers
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = {
  breadcrumb: ''
};

const globalBreadcrumbReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_GLOBAL_BREADCRUMB') {
    return {
      ...state,
      breadcrumb: action.breadcrumb
    };
  }
  return state;
};

export default globalBreadcrumbReducers;
