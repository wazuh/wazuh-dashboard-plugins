/*
 * Wazuh app - React component for show search and filter in the rules,decoder and CDB lists.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { BaseHandler } from './base-handler';
import { QInterpreter, queryObject } from './q-interpreter';
import { suggestItem } from '../wz-search-bar';

export interface qSuggests {
  label: string
  description: string
  operators?: string[]
  values: Function | [] | undefined
}

export class QHandler extends BaseHandler {
  operators = {
    '=': 'Equal',
    '!=': 'Not equal',
    '>': 'Bigger',
    '<': 'Smaller',
    '~': 'Like',
  }
  qSuggests: qSuggests[];

  constructor(qSuggests) {
    super();
    this.qSuggests = qSuggests;
  }

  buildSuggestFields(inputValue:string):suggestItem[] {
    const { field } = this.getLastQuery(inputValue);
    const fields:suggestItem[] = this.qSuggests
    .filter((item) => this.filterSuggestFields(item, field))
    .map(this.mapSuggestFields);
    return fields;
  }

  getLastQuery(inputValue:string):queryObject {
    const qInterpreter = new QInterpreter(inputValue);
    return qInterpreter.lastQuery();
  }

}
