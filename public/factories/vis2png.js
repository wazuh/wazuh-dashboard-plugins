/*
 * Wazuh app - Fetch png from visualization div
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import domtoimage from '../utils/dom-to-image';
import { getAngularModule } from '../../../../src/plugins/discover/public/kibana_services';
const app = getAngularModule('app/wazuh');

export class Vis2PNG {
  /**
   * Class constructor
   * @param {*} $rootScope
   */
  constructor() {
    this.$rootScope = app.$injector.get('$rootScope');
    this.rawArray = [];
    this.htmlObject = {};
    this.working = false;
  }

  /**
   * Validate a visualizations array
   * @param {Array<Object>} visArray
   */
  async checkArray(visArray) {
    try {
      this.working = true;
      const len = visArray.length;
      let currentCompleted = 0;
      await Promise.all(
        visArray.map(async currentValue => {
          const tmpNode = this.htmlObject[currentValue];
          try {
            const tmpResult = await domtoimage.toPng(tmpNode[0]);
            if (tmpResult === 'data:,') return;
            this.rawArray.push({
              element: tmpResult,
              width: tmpNode.width(),
              height: tmpNode.height(),
              id: currentValue
            });
          } catch (error) {} // eslint-disable-line
          currentCompleted++;
          this.$rootScope.reportStatus = `Generating report...${Math.round(
            (currentCompleted / len) * 100
          )}%`;
          this.$rootScope.$applyAsync();
        })
      );

      this.working = false;
      this.$rootScope.reportStatus = `Generating PDF document...`;
      return this.rawArray;
    } catch (error) {
      this.working = false;
      return Promise.reject(error);
    }
  }

  /**
   * Check if is working
   */
  isWorking() {
    return this.working;
  }

  /**
   * Clear raw array
   */
  clear() {
    this.rawArray = [];
    this.htmlObject = {};
  }

  /**
   * Set content to a given html item
   * @param {String} id
   * @param {Object} content
   */
  assignHTMLItem(id, content) {
    this.htmlObject[id] = content;
  }
}
