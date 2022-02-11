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
import { QInterpreter, queryObject } from './q-interpreter';
import { suggestItem } from '../wz-search-bar';

export interface qSuggests {
  label: string
  values?: Function | [] | undefined
  description?: string
  operators?: ('=' | '!=' | '<' | '>' | '~')[]
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
  inputValue: string;
  constructor(qSuggests) {
    super();
    this.qSuggests = qSuggests;
    this.inputStage = 'fields';
    this.inputValue = '';
  }

  //#region Build suggests elements

  async buildSuggestItems(inputValue:string):Promise<suggestItem[]> {
    this.inputValue = inputValue;
    this.isSearch = false;
    if (this.inputStage === 'fields' || inputValue === ''){
      const qInterpreter = new QInterpreter(inputValue);
      this.isSearch = qInterpreter.qNumber() <= 1;
      return this.buildSuggestFields(inputValue);
    } else if (this.inputStage === 'operators') {
      return this.buildSuggestOperators(inputValue);
    } else if (this.inputStage === 'values') {
      return await this.buildSuggestValues(inputValue);
    } else if (this.inputStage === 'conjuntions'){
      return this.buildSuggestConjuntions(inputValue);
    }
    return this.buildSuggestFields(inputValue);
  }

  buildSuggestFields(inputValue:string): suggestItem[] {
    const { field } = this.getLastQuery(inputValue);
    const fields:suggestItem[] = this.qSuggests
    .filter((item) => this.filterSuggestFields(item, field))
    .map(this.mapSuggestFields);
    const fieldExists = fields.some(item => item.label === field);
  
    return [
      ...(fieldExists ? this.buildSuggestOperators(inputValue) : []),
      ...fields
    ];
  }

  buildSuggestOperators(inputValue:string):suggestItem[] {
    const { operators=false } = this.getCurrentField(inputValue);
    const operatorsAllow = operators
      ? operators
      : [...Object.keys(this.operators)];
    const suggestions:suggestItem[] = operatorsAllow.map(this.CreateSuggestOperator);
    return suggestions;
  }

  async buildSuggestValues(inputValue:string):Promise<suggestItem[]> {
    const { values } = this.getCurrentField(inputValue);
    const { value='', operator } = this.getLastQuery(inputValue);
    const rawSuggestions:string[] = typeof values === 'function'
      ? await values(value)
      : values;
    const suggestions = rawSuggestions
      .filter(item => this.filterSuggestValues(item, value))
      .map(this.buildSuggestValue);
    const isLike = operator === '~' && value;
    const valueExists = rawSuggestions.some(sgtValue => sgtValue === value);
    if (this.inputValue !== inputValue || this.inputStage !== 'values') {
      throw "Incorrect suggestions";
    }
    return [
      ...((isLike || valueExists) ? this.buildSuggestConjuntions(inputValue) : []),
      ...suggestions];
  }

  buildSuggestConjuntions(inputValue:string):suggestItem[] {
    const suggestions = [
      {'label':'AND ', 'description':'Requires `both arguments` to be true'},
      {'label':'OR ', 'description':'Requires `one or more arguments` to be true'}
    ].map((item) => {
      return {
        type: { iconType: 'kqlSelector', color: 'tint3' },
        label: item.label,
        description: item.description
      }
    })
    return suggestions;
  }
  
  //#endregion
  
  getLastQuery(inputValue:string):queryObject {
    const qInterpreter = new QInterpreter(inputValue);
    return qInterpreter.lastQuery();
  }
  
  getCurrentField(inputValue:string):qSuggests {
    const { field } = this.getLastQuery(inputValue);
    const currentField = this.qSuggests.find(item => item.label === field);
    if (currentField) {
      return currentField;
    } else {
      throw Error('Error when try to get the current suggest element')
    }
  }

  CreateSuggestOperator = (operator):suggestItem => {
    return {
      type: { iconType: 'kqlOperand', color: 'tint1' },
      label: operator,
      description: this.operators[operator]
    }
  }

  //#region Events

  onItemClick(item:suggestItem, inputValue:string, currentFilters:object):{
    inputValue:string, filters:object
  } {
    const filters = {...currentFilters};
    const qInterpreter = new QInterpreter(inputValue);
    switch (item.type.iconType) {
      case'kqlField':
        qInterpreter.setlastQuery(item.label, 'field');
        this.inputStage = 'operators';
        break;
      case'kqlOperand':
        qInterpreter.setlastQuery(item.label, 'operator');
        this.inputStage = 'values';
        break;
      case'kqlValue':
        qInterpreter.setlastQuery(item.label, 'value');
        filters['q'] = qInterpreter.toString();
        this.inputStage = 'conjuntions';
        break;
      case'kqlSelector':
        qInterpreter.addNewQuery(item.label);
        this.inputStage = 'fields';
        break;
    }
    return {
      inputValue: qInterpreter.toString(),
      filters
    }
  }

  onInputChange(inputValue:string, currentFilters:object):{
    isInvalid: boolean, filters: object
  } {
    const filters = {...currentFilters};
    const { field, conjuntion, operator } = this.getLastQuery(inputValue);
    let isInvalid = false;

    if ( !!conjuntion && !field) {
      this.inputStage = !operator ? 'fields' : 'values';
    } else if ( !!operator ) {
      const fieldExist = this.qSuggests.find(item => item.label === field);
      if (fieldExist) {
        this.inputStage = 'values',
        isInvalid = false;
      } else {
        isInvalid = true;
      }
    } else {
      this.inputStage = 'fields'
    }

    if (inputValue.length === 0) {
      delete filters['q'];
      this.inputStage = 'fields';
    }
    return { isInvalid, filters };
  }

  onKeyPress(inputValue:string, currentFilters:object):{
    inputValue:string, filters: object
  } { 
    const filters = {...currentFilters};
    filters['q'] = inputValue;
    return { inputValue, filters }; 
  }

  //#endregion 

}
