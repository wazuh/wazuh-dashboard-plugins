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
export class ShareAgent {
  constructor() {
    this.agent = null;
    this.selectedGroup = null;
    this.targetLocation = null;
  }

  getAgent() {
    return this.agent;
  }

  getSelectedGroup() {
    return this.agent.group[this.selectedGroup];
  }

  setAgent(ag, group) {
    this.agent = ag;
    this.selectedGroup = group;
  }

  deleteAgent() {
    this.agent = null;
    this.selectedGroup = null;
  }

  getTargetLocation() {
    return this.targetLocation;
  }

  setTargetLocation(loc) {
    if(!loc || typeof loc !== 'object') return;
    this.targetLocation = {};
    Object.assign(this.targetLocation, loc);
  }

  deleteTargetLocation() {
    this.targetLocation = null;
  }
}
