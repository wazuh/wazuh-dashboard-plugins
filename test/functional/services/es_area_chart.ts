/*
 * Wazuh app - Service to generate data from ElasticSearch for compare
 * with visualizations
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
import { SearchParams } from 'elasticsearch';

export function EsAreaChartProvider({ getService, }: FtrProviderContext) {
  const es = getService('es');
  const testSubjects = getService('testSubjects');

  interface OutPut {
    series: Series[],
    xAxisOrderedValues: number[]
  }

  interface Series {
    label: string,
    values: Value[]
  }

  interface Value {
    x: any,
    y: any
  }

  /**
   * Tools to get data of ElasticSearch for compare with visualizations.
   *
   * @class EsAreaChart
   */
  class EsAreaChart {

    /**
     * Generates an object with the data in Elasticsearch to compare with
     * the visualizations
     *
     * @param {SearchParams} query 
     * @param {string} [field=''] The field in the Elasticsearch index
     * @returns {Promise<OutPut>}
     * @memberof EsAreaChart
     */
    async getData (query:SearchParams, field: string = ''): Promise<OutPut> {
      const output: OutPut = {
        series: [],
        xAxisOrderedValues: []
      };

      const alerts = await this.getAlerts(query);

      alerts.forEach((alert: object) => {
        const interval: number = this.calculateInterval(alert._source.timestamp);

        if (!output.xAxisOrderedValues.includes(interval)){
          output.xAxisOrderedValues.push(interval);
        }

        this.composeSeries(alert, field, output, interval);
      });
      this.sortOutput(output);
      return output;
    }

    /**
     * Sort the output of the `getData` method
     *
     * @private
     * @param {OutPut} output
     * @memberof EsAreaChart
     */
    private sortOutput(output: OutPut) {
      output.series.forEach(serie => {
        serie.values = serie.values.sort((a, b) => {
          return a.x - b.x;
        });
      });
      output.series = output.series.sort((a, b) => {

        if (!isNaN(Number(a.label))) {
          return Number(a.label) - Number(b.label);
        }
          
        if (a.label > b.label) {
          return 1;
        } else if (a.label < b.label){
          return -1;
        }
        return 0;
      });
      output.xAxisOrderedValues.sort();
    }

    /**
     * Calculate the correct interval for a time entry
     *
     * @private
     * @param {string} timeString
     * @returns {number}
     * @memberof EsAreaChart
     */
    private calculateInterval (timeString: string):number {
      const RE_PATTERN = /:\d\d:\d\d.\d\d\d/;
      const halfPast = new Date(timeString.replace(RE_PATTERN, ':30:00.000'));
      const oclock = new Date(timeString.replace(RE_PATTERN, ':00:00.000'));
      return (halfPast <= new Date(timeString))
        ? halfPast.getTime()
        : oclock.getTime();
    }

    /**
     * Generate the data series from the Elasticsearch data.
     *
     * @private
     * @param {object} alert
     * @param {string} field
     * @param {object} output
     * @param {number} interval
     * @memberof EsAreaChart
     */
    private composeSeries (alert: object, field: string, output: OutPut, interval: number ) {
      if(output.series.length == 0){
        output.series.push(this.composeSerie(alert, interval, field));
      } else {
        const serie = output.series.find((element) => {
          return element.label == ((field != '') ? this.getFieldValue(alert, field) : 'Alerts');
        })

        if (serie) {
          const serieInterval = serie.values.find((element) => {
            return element.x == interval;
          })

          if (serieInterval) {
            serieInterval.y++;
          } else {
            serie.values.push({x: interval, y: 1});
          }
        } else {
          output.series.push(this.composeSerie(alert, interval, field));
        }
      }
    }

    /**
     * Return a serie object
     *
     * @private
     * @param {object} alert
     * @param {number} interval
     * @param {string} field
     * @returns
     * @memberof EsAreaChart
     */
    private composeSerie (alert: object, interval: number, field: string) {
      return {
        label: (field != '') ? this.getFieldValue(alert, field) : 'Alerts',
        values: [{
          x: interval,
          y: 1
        }]
      };
    }

    /**
     * Get the value of a field of Elasticsearch
     *
     * @private
     * @param {object} alert
     * @param {string} field
     * @returns
     * @memberof EsAreaChart
     */
    private getFieldValue (alert: object, field: string) {
      let evaluateField = '(alert || {})._source'
      for (const key of field.split('.')) {
        evaluateField = `(${evaluateField} || {}).${key}`;
      }
      const result = eval(evaluateField);

      if (typeof result == "number"){
        return result.toString();
      }
      return result;
    }


    /**
     * Get the raw data from the Elasticsearch
     *
     * @private
     * @param {string} [from='now/d']
     * @param {string} [to='now']
     * @returns {object[]}
     * @memberof EsAreaChart
     */
    private async getAlerts (query:SearchParams): Promise<object[]> {
      const alerts = await es.search(query);
      return alerts.hits.hits;
    }


  }
  return new EsAreaChart();
}