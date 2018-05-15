/*
 * Wazuh app - Factory to store visualization tabs
 * 
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

app.factory('tabVisualizations', function() {
    let tabVisualizations = {}
    let currentTab = '';

    const setTab = tab => currentTab = tab; 
    
    const getTab = () => {
        return currentTab;
    }

    const getItem = item => {
        return tabVisualizations[item]
    }

    const assign = tabs => {
        tabVisualizations = tabs;
    }

    const removeAll = () => {
        tabVisualizations = {};
    }
  
    return {
      getItem  : getItem,
      removeAll: removeAll,
      assign   : assign,
      setTab   : setTab,
      getTab   : getTab
    };
});