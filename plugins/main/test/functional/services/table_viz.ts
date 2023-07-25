/*
 * Wazuh app - Tools to test the table visualizations
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


export function TableVizProvider({ getService, }: FtrProviderContext) {
  const find = getService('find');
  const testSubjects = getService('testSubjects');

  /**
   * Tools to test the area table visualizations.
   *
   * @class TableViz
   */
  class TableViz {

    /**
     * Returns the data of a visualization on a processed object.
     *
     * @param {string} selector
     * @returns {Promise<object[]>}
     * @memberof TableViz
     */
    async getValues (selector: string): Promise<object[]> {
      const tableViz = await find.byCssSelector(selector);
      const tableHeader = await testSubjects.findDescendant('paginated-table-header', tableViz);
      const tableBody = await testSubjects.findDescendant('paginated-table-body', tableViz);

      const headerTitles = await this.getHeaderTitles(tableHeader);
      const rows = await this.getRows(tableBody, headerTitles);
      return rows;
    }

    /**
     * Return an array with the titles of the table 
     *
     * @private
     * @param {WebElementWrapper} tableHeader
     * @returns {Promise<string[]>}
     * @memberof TableViz
     */
    private async getHeaderTitles (tableHeader: WebElementWrapper): Promise<string[]>{
      const webElementsTableTitles: WebElementWrapper[] = await tableHeader.findAllByCssSelector('tr > th');
      const titles:string[] = [];
      for (const webElementTitle of webElementsTableTitles) {
        titles.push(await webElementTitle.getVisibleText());
      }
      return titles;
    }

    /**
     * Get all rows from the table visualization
     *
     * @private
     * @param {WebElementWrapper} tableBody
     * @param {string[]} headerTitles
     * @returns {Promise<object[]>}
     * @memberof TableViz
     */
    private async getRows (tableBody: WebElementWrapper, headerTitles: string[]): Promise<object[]> {
      const rows: object[] = [];
      const RE_PATTER = /^\s+$/
      for (const tr of await tableBody.findAllByTagName('tr')) {
        const trText = await tr.getVisibleText();
        if (!RE_PATTER.test(trText)){
          rows.push(await this.getRow(tr, headerTitles));
        }
      }
      return rows;
    }

    /**
     * Returns an object with the data of a row of the table.
     *
     * @private
     * @param {WebElementWrapper} tr
     * @param {string[]} headerTitles
     * @returns {Promise<object>}
     * @memberof TableViz
     */
    private async getRow (tr:WebElementWrapper, headerTitles: string[]): Promise<object> {
      const tds = await tr.findAllByTagName('td');
      const row: object = {};

      for (const key in tds) {
        if (tds.hasOwnProperty(key)) {
          const td = tds[key];
          row[headerTitles[key]] = await td.getVisibleText();
        }
      }
      return row;
    }
  }
  return new TableViz();
}

