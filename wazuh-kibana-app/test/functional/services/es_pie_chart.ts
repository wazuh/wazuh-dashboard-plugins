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

export function EsPieChartProvider({ getService, }: FtrProviderContext) {
  const es = getService('es');

  /**
   * Tools to get data of ElasticSearch for compare with visualizations.
   *
   * @class EsPieChart
   */
  class EsPieChart {

    /**
     * Return the object with the field values
     *
     * @param {string} [field='']
     * @returns
     * @memberof EsPieChart
     */
    async getData (query:SearchParams, field: string = '') {
      const output:object[] = []

      const alerts = await this.getAlerts(query);

      alerts.forEach((alert: object) => {
        const fieldValue = this.getFieldValue(alert, field)
        const values = this.getValues(fieldValue);
        this.composeSerie(values, output);
      });

      output.sort((a, b) => {return b['count'] - a['count']});
      return output;
    }

    /**
     * Extract the value or values of a field
     *
     * @private
     * @param {*} field
     * @returns
     * @memberof EsPieChart
     */
    private getValues (field) {
      let values: string[] = [];
      if (typeof field == 'object') {
        for (const value of field) {
          values = values.concat(this.getValues(value));
        }
      } else {
        values.push(field);
      }
      return values;
    }

    /**
     * Push a new serie or increment the a serie value
     *
     * @private
     * @param {string[]} values
     * @param {object[]} output
     * @memberof EsPieChart
     */
    private composeSerie (values:string[], output:object[]) {
      for (const value of values) {
        const serie = output.find((serie) => {return serie['field'] == value})
        if (serie) {
          serie.count++;
        } else {
          output.push({field: value, count: 1 });
        }
      }
    }

    /**
     * Return all alerts in Elasticsearch
     *
     * @private
     * @param {string} [from='now/d']
     * @param {string} [to='now']
     * @returns {Promise<object[]>}
     * @memberof EsPieChart
     */
    private async getAlerts(query:SearchParams): Promise<object[]> {
      const alerts = await es.search(query);
      return alerts.hits.hits
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

  }

  return new EsPieChart();
}