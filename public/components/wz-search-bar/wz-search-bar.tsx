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
import React, { Component, KeyboardEvent } from 'react';
import PropTypes, {InferProps} from 'prop-types';
import { EuiSuggest } from '../eui-suggest';
import { WzSearchFormatSelector } from './wz-search-format-selector';
import { WzSearchBadges } from './wz-search-badges';
import { QInterpreter, queryObject } from './lib/q-interpreter';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { QHandler, qSuggests } from './lib/q-handler';
import { ApiHandler, apiSuggests } from './lib/api-handler';

export interface suggestItem {
  type: {iconType: string, color: string }
  label: string
  description?: string
}

export default class WzSearchBar extends Component {
  state: {
    searchFormat: string | null
    suggestions: suggestItem[]
    isProcessing: boolean
    inputStage: string
    inputValue: string
    isSearch: boolean
    lastField?: string
    lastOperator?: string
    isInvalid: boolean
    status: string
    filters: {}
  };
  suggestHandler: QHandler | ApiHandler;
  props!:{
    qSuggests: qSuggests[]
    apiSuggests: apiSuggests[]
    onInputChange: Function
    searchDisable?: boolean
  };
  operators: {};

  constructor(props) {
    super(props);
    this.operators = {
      '=': 'Equal',
      '!=': 'Not equal',
      '>': 'Bigger',
      '<': 'Smaller',
      '~': 'Like',
    }

    this.state = {
      searchFormat: (props.qSuggests) ? '?Q' : (props.apiSuggests) ? 'API' : null,
      suggestions: [],
      isProcessing: true,
      inputStage: 'fields',
      inputValue: '',
      isSearch: false,
      isInvalid: false,
      status: 'unchanged',
      filters: {}
    }
    if(this.state.searchFormat === '?Q') {
      this.suggestHandler = new QHandler(props.qSuggests);
    } else {
      this.suggestHandler = new ApiHandler(props.apiSuggests);
    }
  }

  async componentDidMount() {
    const suggestsItems = [...await this.suggestHandler.buildSuggestItems('')];
    this.setState({suggestions: suggestsItems});
  }

  isUpdated() {
    const { isProcessing, isInvalid } = this.state;
    return isProcessing && !isInvalid;
  }

  async componentDidUpdate() {
    if (!this.isUpdated()){
      return;
    }
    const { searchDisable } = this.props;
    const { inputValue } = this.state;
    const suggestsItems = [...await this.suggestHandler.buildSuggestItems(inputValue)];
    const isSearchEnabled = this.suggestHandler.inputStage === 'fields' 
      && !searchDisable 
      && inputValue !== '';

    if (isSearchEnabled) {
      const suggestSearch = this.buildSuggestFieldsSearch();
      suggestSearch && suggestsItems.unshift(suggestSearch);
    }

    this.setState({
      isProcessing: false,
      suggestions: suggestsItems,
    });
  }
  
  

  buildSuggestFieldsSearch():suggestItem | undefined {
    const { inputValue } = this.state;
    const qInterpreter = new QInterpreter(inputValue);
    if (qInterpreter.qNumber() <= 1) {
      const searchSuggestItem: suggestItem = {
        type: { iconType: 'search', color: 'tint8' },
        label: inputValue,
      };
      return searchSuggestItem;
    }
  }

  filterSuggestFields(item:(apiSuggests | qSuggests), field:string='') {
    return item.label.includes(field);
  }

  mapSuggestFields(item:(apiSuggests | qSuggests)):suggestItem {
    const suggestItem = {
      type: { iconType: 'kqlField', color: 'tint4' },
      label: item.label,
    }
    if (item.description) {
      suggestItem['description'] = item.description;
    }
    return suggestItem;
  }



  buildSuggestOperators() {
    const { operators=false } = this.getCurrentField();
    const operatorsAllow = operators
      ? operators
      : [...Object.keys(this.operators)];
    const suggestions:suggestItem[] = operatorsAllow.map(this.CreateSuggestOperator);

    this.setState({
      suggestions,
      isSearch: false,
    })
  }

  getLastQuery():queryObject {
    const { inputValue }= this.state;
    const qInterpreter = new QInterpreter(inputValue);
    return qInterpreter.lastQuery();
  }

  getCurrentField():qSuggests {
    const { field } = this.getLastQuery();
    const { qSuggests } = this.props;
    const currentField = qSuggests.find((item) => {return item.label === field});
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

  async buildSuggestValues() {
    this.setState({status: 'loading'});
    const { values } = this.getCurrentField();
    const rawSuggestions:string[] = typeof values === 'function'
      ? await values()
      : values;
    const filterSuggestions = rawSuggestions.filter(this.filterSuggestValues.bind(this));
    const suggestions:suggestItem[] = []

    for (const value of filterSuggestions) {
      const item:suggestItem = this.buildSuggestValue(value);
      suggestions.push(item);
    }

    this.setState({
      suggestions,
      isSearch: false,
      status: 'unchanged',
    });
  }

  buildSuggestValue(value:string|number) {
    return {
      type: {iconType: 'kqlValue', color: 'tint0'},
      label: typeof value !== 'string' ? value.toString(): value,
    };
  }

  filterSuggestValues(item:number|string) {
    const { value } = this.getLastQuery();
    if (typeof item === 'number' && !!value) {
      // @ts-ignore
      return item == value;
    } else if (!!value) {
      // @ts-ignore
      return item.includes(value);
    }
    return true;
  }

  buildSuggestConjuntions() {
    const suggestions = [
      {'label':',', 'description':'OR'},
      {'label':';', 'description':'AND'}
    ].map((item) => {
      return {
        type: { iconType: 'kqlSelector', color: 'tint3' },
        label: item.label,
        description: item.description
      }
    })
    this.setState({
      suggestions,
      isSearch: false,
    })
  }

  onInputChange = (value:string) => {
    const { filters:currentFilters } = this.state;

    const { isInvalid, filters } = this.suggestHandler.onInputChange(value, currentFilters);
    this.setState({
      inputValue: value,
      isProcessing: true,
      isInvalid,
      filters
    });
  }

  onChangeSearchFormat = (format) => {console.log(format)}

  onKeyPress = (e:KeyboardEvent)  => {
    const { isInvalid } = this.state;
    if(e.key !== 'Enter' && !isInvalid) {
      return;
    }
    const { isSearch, inputValue, filters } = this.state;
    if (isSearch) {
      filters['search'] = inputValue;
      this.setState({inputValue:'', isProcessing: true});
    } else if(inputValue.length > 0) {
      filters['q'] = inputValue;
    }
    this.props.onInputChange(filters);
    this.setState({filters})
  }

  onItemClick(item: suggestItem) {
    const { inputValue, filters } = this.state;
    const {inputValue:newInputValue, filters:newFilters } = this.suggestHandler.onItemClick(item, inputValue, filters);

    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      this.props.onInputChange(filters);
    }

    this.setState({
      inputValue: newInputValue,
      suggestions: [],
      filters: newFilters,
      inputStage: this.suggestHandler.inputStage,
      isProcessing: true,
    });
  }

  onDeleteBadge(badge) {
    const { filters } = this.state;
    delete filters[badge.field];
    this.props.onInputChange(filters);
    this.setState({filters});
  }

  renderFormatSelector() {
    const { qSuggests, apiSuggests } = this.props;
    const qFilterEnabled = qSuggests ? true : false;
    const apiFilterEnabled = apiSuggests ? true : false;
    if (!qFilterEnabled && !apiFilterEnabled) {
      return null;
    }
    return (<WzSearchFormatSelector
      onChange={this.onChangeSearchFormat}
      qFilterEnabled={qFilterEnabled}
      apiFilterEnabled={apiFilterEnabled}
    />);
  }

  render() {
    const { status, suggestions, inputValue, isInvalid, filters } = this.state;
    const formatedFilter = [...Object.keys(filters).map((item) => {return {field: item, value: filters[item]}})];
    const searchFormatSelector = this.renderFormatSelector();
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiSuggest
              status={status}
              value={inputValue}
              onKeyPress={this.onKeyPress}
              onItemClick={this.onItemClick.bind(this)}
              append={searchFormatSelector}
              suggestions={suggestions}
              onInputChange={this.onInputChange}
              isInvalid={isInvalid}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <WzSearchBadges
              filters={formatedFilter}
              onChange={this.onDeleteBadge.bind(this)} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}
