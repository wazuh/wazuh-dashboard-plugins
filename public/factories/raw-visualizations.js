/*
 * Wazuh app - Factory to store visualizations raw content
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.factory('rawVisualizations', function() {
    let list = [];

    const addItem = item => {
        list.push(item);
    }

    const assignItems = items => {
        list = Array.isArray(items) ? items : [];
    }

    const getList = () => {
        return list;
    }

    const removeAll = () => {
        list = [];
    }
  
    return {
      addItem    : addItem,
      getList    : getList,
      removeAll  : removeAll,
      assignItems: assignItems
    };
});