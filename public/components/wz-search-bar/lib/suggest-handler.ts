/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { BaseHandler, IWzSuggestItem, QInterpreter } from './';
import { suggestItem, IWzSearchBarProps } from '../wz-search-bar';
import { queryObject } from './q-interpreter';

export class SuggestHandler extends BaseHandler {
  suggestItems: IWzSuggestItem[];
  inputStage: 'field' | 'operator' | 'value' | 'conjuntion';
  searchType: 'search' | 'q' | 'params';
  filters: {field: string, value: string| number}[];
  props: IWzSearchBarProps;
  setInputValue: Function;
  lastCall: number;
  status: 'unchanged' | 'loading' = 'unchanged';
  operators = {
    '=': 'Equal',
    '!=': 'Not equal',
    '>': 'Bigger',
    '<': 'Smaller',
    '~': 'Like',
    ':': 'Equals',
  }

  constructor(props, setInputValue ) {
    super();
    this.props = props;
    this.filters = props.filters;
    this.inputStage = 'field';
    this.setInputValue = setInputValue;
    this.suggestItems = props.suggestions;
    this.searchType = 'search';
    this.lastCall = 0;
  }

  combine = (...args) => (input) => args.reduceRight((acc, arg) => acc = arg(acc), input)

  checkType = (input:string) => {
    const operator = /:|=|!=|~|<|>/.exec(input)
    this.searchType = operator 
      ? operator[0] === ':' ? 'params' : 'q'
      : 'search'
    return input;
  };

  checkStage = (input:string) => {
    const { searchType } = this;
    if (searchType === 'search'){
      this.inputStage = 'field';
      return {field: input}
    } else if (searchType === 'params') {
      this.inputStage = 'value';
      const {0:field, 1:value} = input.split(':');
      return {field, value};
    } else if (searchType === 'q') {
      const qInterpreter = new QInterpreter(input);
      const {conjuntion, field, operator, value} = qInterpreter.lastQuery();
      if(!!conjuntion && !field) {
        this.inputStage = !operator ? 'field' : 'value';
      } else if (!!operator) {
        this.inputStage = 'value';
      } else {
        this.inputStage = 'field';
      }
      return {conjuntion, field, operator, value};
    }
    return input;
  }

  someItem = (queryElement, key) => this.suggestItems.some(item => item[key] === queryElement);
  findItem = (queryElement, key) => this.suggestItems.find(item => item[key] === queryElement);

  checkQuery = async (query:queryObject) => {
    const { inputStage, lastCall } = this;
    const { field='', value='' } = query;
    const suggestions = [
      ...this.buildSuggestSearch(field),
      ...(value && inputStage === 'value' ? this.buildSuggestApply() : []),
      ...(value && inputStage === 'value' ? this.buildSuggestConjuntions(field) : [] ),
      ...((this.someItem(field, 'label') && inputStage !== 'value') ? this.buildSuggestOperator(field) : []),
      ...(inputStage === 'field' ? this.buildSuggestFields(field) : []),
      ...(inputStage === 'value' ? await this.buildSuggestValues(field, value) : [])
    ]
    if ( lastCall === this.lastCall){
      this.lastCall++;
      return suggestions;
    }
    throw "new call";
  }


  public buildSuggestItems = async (inputValue: string) => 
    this.combine(this.checkQuery, this.checkStage, this.checkType)(inputValue);

  buildSuggestSearch(inputValue): suggestItem[] {
    const {searchDisable} = this.props;
    if (!searchDisable && this.searchType === 'search'){
      return [{
        label: inputValue,
        type: { iconType: 'search', color: 'tint8' },
        description: 'Search',
      }]
    }
    return []
  }

  buildSuggestApply(): suggestItem[] {
    return [{
      label: 'Apply filter',
      type: { iconType: 'kqlFunction', color: 'tint5' },
      description: 'Click here or press "Enter" to apply the filter',
    }]
  }

  buildSuggestFields(inputValue: string) {
    return this.suggestItems
      .filter(item => item.label.includes(inputValue))
      .map(this.mapSuggestFields);
  }

  buildSuggestOperator(inputValue: string) {
    const { operators } = this;
    const operatorSuggest = op => ({
      label: op,
      description: operators[op],
      type: {iconType: 'kqlOperand', color: 'tint1'}
    })
    const item = this.findItem(inputValue, 'label');
    if (item && item.type === 'params') {
      return [operatorSuggest(':')];
    } else {
      const ops = (item || {}).operators || Object.keys(operators)
      return ops
        .filter(op => op !== ':').map(operatorSuggest)
    }    
  }

  async buildSuggestValues(field:string, value:string) {
    const item = this.findItem(field, 'label');
    const rawSuggestions:string[] = (item && typeof item.values === 'function')
      ? await this.getFunctionValues(item, value)
      : (item || {}).values;
    const suggestions = rawSuggestions.map(this.buildSuggestValue);
    return suggestions;
  }

  buildSuggestConjuntions(inputValue:string):suggestItem[] {
    if (this.searchType !== 'q') return [];
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

  async getFunctionValues(item, value) {
    const {setStatus} = this.props;
    this.status = 'loading'
    setStatus('loading');
    const values = await item.values(value)
    this.status = 'unchanged'
    setStatus('unchanged');
    return values;
  }

  createParamFilter(field, value) {
    const filters = [...this.filters];
    const idx = filters.findIndex(filter => filter.field === field );
      idx !== -1
      ? filters[idx].value = value 
      : filters.push({field: field, value});
      this.props.onFiltersChange(filters);
      this.setInputValue('');
  }

  createQFilter(inputValue) {
    const qInterpreter = new QInterpreter(inputValue);
    const value = qInterpreter.toString();
    const filters = [
      ...this.filters,
      {field: 'q', value}
    ];
    this.props.onFiltersChange(filters);
    this.setInputValue('');

  }

  onItemClick(item, inputValue) {
    if (this.status === 'loading') return;
    switch (item.type.iconType) {
      case 'search':
        this.createParamFilter('search', item.label);
        break;
      case 'kqlField':
        this.searchType = (this.suggestItems.find(e => e.label === item.label) || {type:'params'}).type;
        if (this.searchType === 'params') {
          this.setInputValue(`${item.label}:`);
        } else {
          const qInterpreter = new QInterpreter(inputValue);
          qInterpreter.setlastQuery(item.label, 'field');
          this.setInputValue(qInterpreter.toString());
        }
        break;
      case 'kqlOperand':
        this.setInputValue(`${inputValue}${item.label}`);
        break;
      case 'kqlValue':
        if(this.searchType === 'params') {
          const { 0:field } = inputValue.split(':');
          this.createParamFilter(field, item.label);
        } else {
          const qInterpreter = new QInterpreter(inputValue);
          qInterpreter.setlastQuery(item.label, 'value');
          this.setInputValue(qInterpreter.toString());
        }
        break;
      case 'kqlSelector':
        const qInterpreter = new QInterpreter(inputValue);
        qInterpreter.addNewQuery(item.label);
        this.setInputValue(qInterpreter.toString());
        break;
      case 'kqlFunction':
        if (this.searchType === 'q') {
          this.createQFilter(inputValue);
        } else if (this.searchType === 'params') {
          const { 0:field, 1:value } = inputValue.split(':');
          this.createParamFilter(field, value);
        }
        break;
    }
  }

  onKeyPress(inputValue, event) {
    if (event.key !== 'Enter') return;
    const { inputStage, searchType } = this;
    if (searchType === 'search') {
      this.createParamFilter(inputValue, 'search');
    }
    if (inputStage !== 'value') return;
    if (searchType === 'params') {
      const {0: field, 1:value} = inputValue.split(':');
      this.createParamFilter(field, value);
    }
    if (searchType === 'q') {
      this.createQFilter(inputValue);
    }
  }
}