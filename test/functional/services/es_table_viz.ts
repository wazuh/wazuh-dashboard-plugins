/*
 * Wazuh app - Service to generate data from ElasticSearch for compare
 * with visualizations
 * Copyright (C) 2015-2019 Wazuh, Inc.
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

export function EsTableVizProvider({ getService, }: FtrProviderContext) {
  const es = getService('es');
  const sortArray = getService('sortArray');
  const testSubjects = getService('testSubjects');

  class EsTableViz {

    async getData(query:SearchParams, fields:any[], orderField:string[]) {
      const alerts = await this.getAlerts(query);
      const data = await this.getSeries(alerts, fields);

      if (orderField) {
        const sortedData = sortArray.sortData(data, orderField);
        return  this.stringfyData(sortedData);
      }

      return this.stringfyData(data);
    }

    private stringfyData (data:object[]) {
      return data.map((element) => {
        const newElement = {}
        for (const key of Object.keys(element)) {
          if (typeof element[key] === 'number') {
            newElement[key] = element[key].toString();
          } else {
            newElement[key] = element[key];
          }
        }
        return newElement;
      })
    }

    
    private getSeries (alerts, fields) {
      const series = []
      for (const alert of alerts) {
        const serie = this.createSerie(alert, fields);
        const findSerie = this.serieExists(serie, series, fields);
        this.createOrUpdateSerie(findSerie, serie, series, fields);
      }

      return series;
    }

    private createSerie (alert, fields) {
      const serie = {};
      for (const field of fields) {
        if (Object.keys(field).includes('method')) {
          serie[field.label] = 1
        } else {
          serie[field.label] = this.getFieldValue(alert, field.field);
        }
      }
      return serie;
    }


    private serieExists (serie, series, fields) {
      return series.find((s) => {
        for (const field of fields) {
          if (!Object.keys(field).includes('method')) {
            if (s[field.label] !== serie[field.label]) {
              return false;
            }
          }
        }
        return true;
      });
    }

    private createOrUpdateSerie (findSerie, serie, series, fields) {
      if (findSerie) {
        for (const field of fields) {
          if (Object.keys(field).includes('method')) {
            findSerie[field.label]++;
          }
        }
      } else {
        series.push(serie);
      }
    }


    private async getAlerts (query: SearchParams): Promise<object[]> {
      const es_index = await testSubjects.getVisibleText('wzMenuPatternTitle');
      const alerts = await es.search(query);
      return alerts.hits.hits;
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
  return new EsTableViz();
}