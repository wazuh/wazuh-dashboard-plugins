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

  //#region Build suggests elements

  buildSuggestItems(inputValue:string):suggestItem[] {
    if (this.inputStage === 'fields' || inputValue === ''){
      return this.buildSuggestFields(inputValue);
    } else if (this.inputStage === 'values') {
      return []// this.buildSuggestValues();
    }
    return this.buildSuggestFields(inputValue);
  }

  buildSuggestFields(inputValue:string):suggestItem[] {
    const { field } = this.inputInterpreter(inputValue);
    const fields:suggestItem[] = this.apiSuggest
    .filter((item) => this.filterSuggestFields(item, field))
    .map(this.mapSuggestFields)
    return fields;
  }

  //#endregion

  inputInterpreter(input:string):{field:string, value:boolean|string} {
    const { 0:field, 1:value=false } = input.split(':');
    return {field, value}; 
  }

  //#region Events

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


  onInputChange(inputValue:string, currentFilters:object):{
    isInvalid: boolean, filters: object
  } {
    const { field, value } = this.inputInterpreter(inputValue);
    let isInvalid = false;
    if (value !== false) {
      const fieldExist = this.apiSuggest.find(item => item.label === field);
      if (fieldExist) {
        this.inputStage = 'values';
        isInvalid = false;
      } else {
        isInvalid = true;
      }
    } else {
      isInvalid = false;
      this.inputStage = 'fields';
    }

    return {isInvalid, filters:currentFilters};
  }

  //#endregion
}