/*
 * Wazuh app - Factory to share an agent between controllers
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

app.factory('shareAgent', function() {
    let agent = null;

    const getAgent    = () => agent;
    const setAgent    = in_agent => agent = in_agent;
    const deleteAgent = () => agent = null;
  
    return {
      getAgent,
      setAgent,
      deleteAgent
    };
});