/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
    description?: string
    values?: [] | Function | undefined
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

  async buildSuggestItems(inputValue:string):Promise<suggestItem[]> {
    if (!this.apiSuggest) {
      this.isSearch = true;
      return [];
    }
    this.isSearch = false;
    if (this.inputStage === 'fields' || inputValue === ''){
      this.isSearch = true;
      return this.buildSuggestFields(inputValue);
    } else if (this.inputStage === 'values') {
      return await this.buildSuggestValues(inputValue);
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

  async buildSuggestValues(inputValue:string):Promise<suggestItem[]> {
    const { values } = this.getCurrentField(inputValue);
    const { value } = this.inputInterpreter(inputValue);
    
    const rawSuggestions:string[] = typeof values === 'function'
      ? await values(value)
      : values;
    //@ts-ignore
    const filterSuggestions = rawSuggestions.filter(item => this.filterSuggestValues(item, value));
    const suggestions:suggestItem[] = [];
    
    for (const value of filterSuggestions) {
      const item:suggestItem = this.buildSuggestValue(value);
      suggestions.push(item);
    }

    return suggestions;
  }

  //#endregion

  inputInterpreter(input:string):{field:string, value:boolean|string} {
    const { 0:field, 1:value=false } = input.split(':');
    return {field, value}; 
  }

  getCurrentField(inputValue:string):apiSuggests {
    const { field } = this.inputInterpreter(inputValue);
    const currentField = this.apiSuggest.find(item => item.label === field);
    if (currentField) {
      return currentField;
    } else {
      throw Error('Error when try to get the current suggest element')
    }
  }

  //#region Events

  onItemClick(item:suggestItem, inputValue, currentFilters:object):{
    inputValue:string, filters:object
  } {
    const { field } = this.inputInterpreter(inputValue);
    const filters = {...currentFilters};
    switch (item.type.iconType) {
      case 'kqlField':
        this.inputStage = 'values';
        inputValue = item.label + ':';
        break;
      case 'kqlValue':
        inputValue = '';
        filters[field] = item.label;
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

  onKeyPress(inputValue:string, currentFilters:object):{
    inputValue:string, filters: object
  } {
    const filters = {...currentFilters};
    const { field, value } = this.inputInterpreter(inputValue);

    filters[field] = value;

    return { inputValue: '', filters }; 
  }

  //#endregion
}