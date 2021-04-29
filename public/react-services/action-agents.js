/*
 * Wazuh app - Acntion Agents Service
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WzRequest } from './wz-request';
import { getToasts }  from '../kibana-services';

export class ActionAgents {
  static showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  /**
   * Make the action (upgrade, restart or delete) to a specific group of agents
   * @param {Object} filters
   */
  static async getAllAgents(filters){
    try{
      const params = filters.q ? {q: filters.q, limit: 500} : { limit: 500 };
      const output = await WzRequest.apiReq('GET', `/agents`, {params: params});
      const totalItems = (((output || {}).data || {}).data || {}).total_affected_items;
      let itemsArray = [];
      if (totalItems && output.data && output.data.data && totalItems > 500) {
        params.offset = 0;
        itemsArray.push(...output.data.data.affected_items);
        while (itemsArray.length < totalItems && params.offset < totalItems) {
          params.offset += params.limit;
          const tmpData = await WzRequest.apiReq(
            'GET',
            `/agents`,
            { params: params },
          );
          itemsArray.push(...tmpData.data.data.affected_items);
        }
        const allowedAgents = itemsArray;
        return allowedAgents;
      }
      else{
        const allowedAgents = output.data.data.affected_items;
        return allowedAgents;
      }
    }catch(error) {   
      getToasts().addError(error, {title: `Error getting user authorized agents`});
      return Promise.reject();
    }
  }

  /**
   * Make a string of all agents, and do some calls according to the maximum agents permitted in this call
   * @param {String} action
   * @param {String} type
   * @param {Array} agents
   */
  static async redirectActionAgents(action, type, agents){
    if(type === 'one' && agents.id !== '000')
        this.actionAgentCall(action, agents);
    else{
      agents = agents.filter(function(item){ if(item.id !== '000'){ return item; }})
      if(action === 'upgrade' && agents.length > 100){
        for (let i = 0; i < agents.length; i=i+100) {
          let activeAgents = [];
          agents.slice(i, i+100).map(item => {
            if(item.status === 'active' && item.outdated && item.id != '000')
              activeAgents.push(item.id);
            });
          if(activeAgents.length !== 0)
            this.actionAgentCall(action, activeAgents);
        }
      }
      else if(action === 'upgrade' || action === 'restart'){
        this.actionAgentCall(action, agents.filter(function(item){
          if(item.status === 'active' && action === 'upgrade' && item.outdated){
            return item;
          }
          else if(item.status === 'active' && action === 'restart'){
            return item;
          }
          }).map(item => item.id));
      }
      else{
        for (let i = 0; i < agents.length; i=i+100) {
          this.actionAgentCall(action, agents.map(item => item.id));
        }
      }
    }
  }

   /**
   * Make the action (upgrade, restart or delete) to a specific group of agents
   * @param {String} action
   * @param {Array} agents
   */
  static async actionAgentCall(action, agents){
    const agentsFormatted = (typeof agents !== 'string') ? agents.toString() : agents;
    const commandType = (action === 'delete') ? 'DELETE' : 'PUT';
    const firstCommand = (action === 'delete') ? `` : `/${action}`
    const statusDelete = (action === 'delete') ? '&status=all' : ''
    try {
      const result = await WzRequest.apiReq(
        `${commandType}`,
        `/agents${firstCommand}?agents_list=${agentsFormatted}${statusDelete}&pretty=true`,
        {}
      );
      const messageShowed = action.charAt(0).toUpperCase() + (action === 'delete' ? action.slice(1, action.length-1) : action.slice(1)) + 'ing agents ...';
      if(result.data.data.affected_items.length > 0){
        this.showToast('success', messageShowed, '', 5000);
      }
      if(result.data.data.failed_items.length > 0){
        messageShowed = 'Error' + messageShowed.charAt(0).toLowerCase() + messageShowed.slice(1, messageShowed.length); 
        this.showToast('warning', messageShowed, result.data.data.failed_items.toString(), 5000);
      }
    } catch (error) {
      const messageShowed = 'Error' + (action === 'delete' ? action.slice(0, action.length-1) : action.slice(0)) + 'ing agents ...';
      this.showToast('warning', messageShowed, error , 5000);
      return Promise.reject(error);
    }
  }

  /**
   * This function compare version between any agents and master.
   * Return true if ManagerVersion > AgentVersion
   * @param {String} agentVersion
   * @param {String} managerVersion
   * @returns {Boolean}
   */
  static compareVersions(managerVersion, agentVersion) {
    let agentMatch = new RegExp(
      /[.+]?v(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/
    ).exec(agentVersion);
    let managerMatch = new RegExp(
      /[.+]?v(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/
    ).exec(managerVersion);
    if (agentMatch === null || managerMatch === null) return;
    return managerMatch[1] <= agentMatch[1]
      ? managerMatch[2] <= agentMatch[2]
        ? managerMatch[3] <= agentMatch[3]
          ? true
          : false
        : false
      : false;
  }
}
