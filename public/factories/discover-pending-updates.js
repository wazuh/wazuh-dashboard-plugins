/*
 * Wazuh app - Factory to store pending updates from Discover
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
export class DiscoverPendingUpdates {
  /**
   * Class constructor
   */
  constructor() {
    if (!!DiscoverPendingUpdates.instance) {
      return DiscoverPendingUpdates.instance;
    }
    this.pendingUpdates = [];

    DiscoverPendingUpdates.instance = this;
    return this;
  }

  /**
   * Add new pending update
   * @param {Object} query
   * @param {Object} filters
   */
  addItem(query, filters) {
    this.pendingUpdates.push(query, filters);
  }

  /**
   * Get the list of pending updates
   */
  getList() {
    return this.pendingUpdates;
  }

  /**
   * Remove all pending updates
   */
  removeAll() {
    this.pendingUpdates = [];
  }
}
