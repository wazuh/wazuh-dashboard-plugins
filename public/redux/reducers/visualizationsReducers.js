/*
 * Wazuh app - Visualizations Reducers
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = {};

const visualizationsReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_METRIC') {
    const metric = {};
    metric[action.metric.name] = action.metric.value;
    return {
      ...state,
      ...metric
    };
  }
  if (action.type === 'UPDATE_VIS') {
    return {
      ...state,
      shouldUpdate: action.update.update
    };
  }
  return state;
};

export default visualizationsReducers;
