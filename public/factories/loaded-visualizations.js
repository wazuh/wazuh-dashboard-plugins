/*
 * Wazuh app - Factory to store loaded visualizations
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class LoadedVisualizations {
  /**
   * Class constructor
   */
  constructor() {
    this.list = [];
  }

  /**
   * Add new item to the loaded visualizations list
   * @param {Object} item
   */
  addItem(item) {
    this.list.push(item);
  }

  /**
   * Get the loaded visualizations list
   */
  getList() {
    return this.list;
  }

  /**
   * Remove all loaded visualizations list
   */
  removeAll() {
    this.list = [];
  }
}
