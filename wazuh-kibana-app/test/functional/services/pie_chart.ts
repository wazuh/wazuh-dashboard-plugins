/*
 * Wazuh app - Tools to test the pie chart visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { FtrProviderContext } from '../../../../../test/functional/ftr_provider_context';

export function PieChartsProvider({ getService,getPageObjects }: FtrProviderContext) {
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common', ]);

  /**
   * Tools to test the area chart visualizations.
   *
   * @class PieCharts
   */
  class PieCharts {

    /**
     * Returns the data of a visualization on a processed object
     *
     * @param {string} selector
     * @returns
     * @memberof PieCharts
     */
    async getValues (selector: string) {
      await PageObjects.common.sleep(3000);
      const element: object[] = await browser.execute(
        `return d3.select('${selector} div.visWrapper__column svg')[0][0].__data__.raw`
      );
      const output: object[] = []
      this.composeSeries(element, output);
      return output;
    }

    /**
     * Generate series from the raw data of a visualization
     *
     * @private
     * @param {*} element
     * @param {*} output
     * @memberof PieCharts
     */
    private composeSeries (element, output) {
      for (const row of element.rows) {
        const keys = Object.keys(row);
        output.push({field: row[keys[0]], count: row[keys[1]] });
      }
    }

  }

  return new PieCharts();
}