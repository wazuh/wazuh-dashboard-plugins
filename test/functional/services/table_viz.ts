/*
 * Wazuh app - Tools to test the table visualizations
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
import { WebElementWrapper } from '../../../../../test/functional/services/lib/web_element_wrapper/web_element_wrapper';


export function TableVizProvider({ getService, }: FtrProviderContext) {
  const find = getService('find');
  const testSubjects = getService('testSubjects');

  class TableViz {
      
    async getValues (selector: string) {
      const tableViz = await find.byCssSelector(selector);
      const tableHeader = await testSubjects.findDescendant('paginated-table-header', tableViz);
      const tableBody = await testSubjects.findDescendant('paginated-table-body', tableViz);
      

      const headerTitles = await this.getHeaderTitles(tableHeader);
      const rows = await this.getRows(tableBody, headerTitles);
      return rows;
    }

    async getHeaderTitles (tableHeader: WebElementWrapper){
      const webElementsTableTitles: WebElementWrapper[] = await tableHeader.findAllByCssSelector('tr > th');
      const titles:string[] = [];
      for (const webElementTitle of webElementsTableTitles) {
        titles.push(await webElementTitle.getVisibleText());
      }
      return titles;
    }

    async getRows (tableBody: WebElementWrapper[], headerTitles: string[]) {
      const rows: object[] = [];

      for (const tr of await tableBody.findAllByTagName('tr')) {
        rows.push(await this.getRow(tr, headerTitles));
      }
      return rows;
    }

    async getRow (tr:WebElementWrapper, headerTitles: string[]) {
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
  
