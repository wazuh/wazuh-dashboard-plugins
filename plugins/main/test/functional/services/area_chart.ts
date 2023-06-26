/*
 * Wazuh app - Tools to test the area chart visualizations
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
import { WebElementWrapper } from '../../../../../test/functional/services/lib/web_element_wrapper/web_element_wrapper';


export function AreaChartProvider({ getService, }: FtrProviderContext) {
  const browser = getService('browser');


  /**
   * Tools to test the area chart visualizations.
   *
   * @class AreaChart
   */
  class AreaChart {

    /**
     * Get raw data from visualization and return a processing object
     *
     * @param {string} selector
     * @returns
     * @memberof AreaChart
     */
    async getValues (selector: string) {
      const element: object[] = await browser.execute(
        `return d3.select('${selector} div.visWrapper__column svg')[0][0].__data__`
      );
      const output: object = {
        series: this.composeSeries(element['series']),
        xAxisOrderedValues: element['xAxisOrderedValues'].sort()
      }
      return output;
    }

    /**
     * Generate data series from visualization data
     *
     * @private
     * @param {object[]} element
     * @returns
     * @memberof AreaChart
     */
    private composeSeries (element: object[]) {
      const series: object[] = [];
      element.forEach((serie) => {
        series.push({
          label: serie['label'],
          values: this.composeValues(serie['values'])
        });
      });
      return series.sort((a, b) => {

        if (!isNaN(Number(a['label']))) {
          return Number(a['label']) - Number(b['label']);
        }
          
        if (a['label'] > b['label']) {
          return 1;
        } else if (a['label'] < b['label']){
          return -1;
        }
        return 0;
      });
    }

    /**
     * Generate data values from visualization data
     *
     * @private
     * @param {object[]} values
     * @returns
     * @memberof AreaChart
     */
    private composeValues (values:object[]) {
      const filteredValues = values.filter((value) => {
        return value['xi'] === undefined;
      }).map((value) => {
        return {x: value['x'], y: value['y']};
      });

      return filteredValues.sort((a,b) => {return a['x'] - b['x']});
    }


  }

  return new AreaChart();
}