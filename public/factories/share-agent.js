/*
 * Wazuh app - Factory to share an agent between controllers
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class ShareAgent {
  /**
   * Class constructor
   */
  constructor() {
    if (!!ShareAgent.instance) {
      return ShareAgent.instance;
    }

    this.agent = null;
    this.selectedGroup = null;
    this.targetLocation = null;

    ShareAgent.instance = this;
    return this;
  }

  /**
   * Get current agent
   */
  getAgent() {
    return this.agent;
  }

  /**
   * Get selected group
   */
  getSelectedGroup() {
    if (
      this.agent &&
      this.agent.group &&
      (this.selectedGroup || this.selectedGroup === 0)
    ) {
      return this.agent.group[this.selectedGroup];
    }
    return null;
  }

  /**
   * Set a given agent and group as current
   * @param {*} ag
   * @param {*} group
   */
  setAgent(ag, group) {
    this.agent = ag;
    this.selectedGroup = group;
  }

  /**
   * Delete current agent
   */
  deleteAgent() {
    this.agent = null;
    this.selectedGroup = null;
  }

  /**
   * Get Target location
   */
  getTargetLocation() {
    return this.targetLocation;
  }

  /**
   * Set Target location
   * @param {Object} loc
   */
  setTargetLocation(loc) {
    if (!loc || typeof loc !== 'object') return;
    this.targetLocation = {};
    Object.assign(this.targetLocation, loc);
  }

  /**
   * Delete target location
   */
  deleteTargetLocation() {
    this.targetLocation = null;
  }
}
