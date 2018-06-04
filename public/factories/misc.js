/*
 * Wazuh app - Factory to share common variables between controllers
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

app.factory('wzMisc', function() {
    const state = {
        apiIsDown: false,
        comeFromWizard: false
    }

    const setApiIsDown = value => state.apiIsDown = value;
    const setWizard    = value => state.comeFromWizard = value;
    const setGeneric   = (key,value) => state[key] = value;
    const getValue     = key   => state[key];
  
    return {
       setGeneric,
       setApiIsDown,
       setWizard,
       getValue
    };
});