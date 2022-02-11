/*
 * Wazuh app - Factory to store visualizations raw content
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class RawVisualizations {
  /**
   * Class constructor
   */
  constructor() {
    if (!!RawVisualizations.instance) {
      return RawVisualizations.instance;
    }
    this.list = [];
    this.type = "";

    RawVisualizations.instance = this;
    return this;
  }

  /**
   * Add item to raw visualizations
   * @param {Object} item
   */
  addItem(item) {
    this.list.push(item);
  }
  /**
   * Set raw raw visualizations with given items
   * @param {Array<Object>} items
   */
  assignItems(items) {
    this.list = Array.isArray(items) ? items : [];
  }

  /**
   * Get raw visualizations
   */
  getList() {
    return this.list;
  }

  /**
   * Remove all raw visualizations
   */
  removeAll() {
    this.list = [];
  }

  /**
   * Set type
   */
  setType(type) {
    this.type = type;
  }

  /**
   * Get type
   */
  getType() {
    return this.type;
  }
}
