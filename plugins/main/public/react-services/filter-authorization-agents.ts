/*
* Wazuh app - React component for get authorized agents.
* Copyright (C) 2015-2022 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
import { AppState } from '../react-services/app-state';
import { AUTHORIZED_AGENTS } from '../../common/constants';
import { WazuhConfig } from '../react-services/wazuh-config';

export function getFilterWithAuthorizedAgents(agentsIds, pattern) {
   //check for empty agents array
  if(!agentsIds || agentsIds.length == 0) return;

  const wazuhConfig = new WazuhConfig();
  const config = wazuhConfig.getConfig();
  const statisticsPattern = `${config['cron.prefix']}-${config['cron.statistics.index.name']}-*`
  if(pattern == statisticsPattern) return;
  
  const usedPattern = pattern ? pattern : AppState.getCurrentPattern();
  const isMonitoringIndex = usedPattern.indexOf('monitoring') > -1;
  const field = isMonitoringIndex ? 'id' : 'agent.id';
  return  {
    meta: {
      index: usedPattern,
      type: 'phrases',
      key: field,
      value: agentsIds.toString(),
      params: agentsIds,
      alias: null,
      negate: false,
      disabled: false,
      controlledBy: AUTHORIZED_AGENTS,
    },
    query: {       
      bool: {
        should: agentsIds.map(id => {
          return {
            match_phrase: {
              [field]: id
            }
          };
        }),
        minimum_should_match: 1
      }
    },
    $state: {
      store: 'appState'
    }
  }
}
