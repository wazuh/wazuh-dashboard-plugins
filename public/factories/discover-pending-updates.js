/*
 * Wazuh app - Factory to store pending updates from Discover
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
export class DiscoverPendingUpdates {
  constructor() {
    this.pendingUpdates = [];
  }

  addItem(query, filters) {
    this.pendingUpdates.push(query, filters);
  }

  getList() {
    return this.pendingUpdates;
  }

  removeAll() {
    this.pendingUpdates = [];
  }
}
