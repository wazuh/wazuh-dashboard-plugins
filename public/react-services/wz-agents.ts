/*
 * Wazuh app - Services related to agents
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ErrorToastOptions } from 'kibana/public';
import { WAZUH_AGENTS_OS_TYPE } from '../../common/constants';
import { getToasts } from '../kibana-services';
import { UnsupportedComponents } from '../utils/components-os-support';
import IApiResponse from './interfaces/api-response.interface';
import { WzRequest } from './wz-request';

export function getAgentOSType(agent){
  if(agent?.os?.uname?.toLowerCase().includes(WAZUH_AGENTS_OS_TYPE.LINUX)){
    return WAZUH_AGENTS_OS_TYPE.LINUX;
  }else if (agent?.os?.platform === WAZUH_AGENTS_OS_TYPE.WINDOWS) {
    return WAZUH_AGENTS_OS_TYPE.WINDOWS;
  } else if (agent?.os?.platform === WAZUH_AGENTS_OS_TYPE.SUNOS) {
    return WAZUH_AGENTS_OS_TYPE.SUNOS;
  } else if (agent?.os?.platform === WAZUH_AGENTS_OS_TYPE.DARWIN) {
    return WAZUH_AGENTS_OS_TYPE.DARWIN;
  }else {
    return WAZUH_AGENTS_OS_TYPE.OTHERS;
  }
};

export function hasAgentSupportModule(agent, component){
  const agentOSType = getAgentOSType(agent);
  return !(UnsupportedComponents[agentOSType].includes(component));
};


export async function getAuthorizedAgents() {
  const agentsList: IApiResponse<{id: string}> = await WzRequest.apiReq('GET', `/agents`, {})
  .catch(error => {   
    getToasts().addError(error, {title: `Error getting user authorized agents`} as ErrorToastOptions);
    return Promise.reject();
  });

  const allowedAgents = agentsList ? agentsList.data.data.affected_items.map((agent) => agent.id) : []

  return allowedAgents;
}