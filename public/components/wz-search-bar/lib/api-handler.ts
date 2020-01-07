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
import { suggestItem } from '../wz-search-bar';

export interface apiSuggests {
    label: string
    description: string
    values?: string[]
    multiValue?: boolean
    range?: boolean
  }

export class ApiHandler extends BaseHandler {
  apiSuggest: apiSuggests[];

  constructor(apiSuggests) {
    super()
    this.apiSuggest = apiSuggests;
    this.inputStage = 'fields';
  }

  buildSuggestItems(inputValue:string):suggestItem[] {
    if (this.inputStage === 'fields' || inputValue === ''){
      return this.buildSuggestFields(inputValue);
    } else if (this.inputStage === 'values') {
      return []// this.buildSuggestValues();
    }
  }

  buildSuggestFields(inputValue:string):suggestItem[] {
    const { 0:field } = inputValue.split(':');
    const fields:suggestItem[] = this.apiSuggest
    .filter((item) => this.filterSuggestFields(item, field))
    .map(this.mapSuggestFields)
    return fields;
  }

  onItemClick(item:suggestItem, inputValue, currentFilters:object):{
    inputValue:string, filters:object
  } {
    const filters = {...currentFilters};
    switch (item.type.iconType) {
      case 'kqlField':
        this.inputStage = 'values';
        inputValue = item.label + ':';
        break;
      case 'kqlValue':
        break;
    }
    return {inputValue, filters};
  }
}