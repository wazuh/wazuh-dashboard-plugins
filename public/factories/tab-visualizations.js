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
import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

app.factory('tabVisualizations', function() {
    const agents = {
        welcome      : 0,
        general      : 7,
        fim          : 8,
        pm           : 4,
        vuls         : 7,
        oscap        : 13,
        ciscat       : 0,
        audit        : 15,
        gdpr         : 3,
        pci          : 3,
        virustotal   : 6,
        configuration: 0
    }

    const overview = {
        welcome   : 0,
        general   : 11,
        fim       : 10,
        pm        : 5,
        vuls      : 8,
        oscap     : 14,
        ciscat    : 0,
        audit     : 15,
        pci       : 6,
        gdpr      : 6,
        aws       : 10,
        virustotal: 7
    }

    let tabVisualizations = {}
    let currentTab = '';

    const setTab = tab => currentTab = tab;

    const getTab = () => {
        return currentTab;
    }

    const getItem = item => tabVisualizations[item]

    const assign = tabs => {
        if(typeof tabs === 'object') {
            tabVisualizations = tabs;
        } else if(typeof tabs === 'string') {
            tabVisualizations = tabs === 'overview' ?
                                overview :
                                agents;
        }
    }

    const removeAll = () => tabVisualizations = {};

    return {
      getItem,
      removeAll,
      assign,
      setTab,
      getTab
    };
});
