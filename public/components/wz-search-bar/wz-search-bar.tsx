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
    inputValue: string
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

  constructor(props) {
    super(props);

    this.state = {
      searchFormat: (props.qSuggests) ? '?Q' : (props.apiSuggests) ? 'API' : null,
      suggestions: [],
      isProcessing: true,
      inputValue: '',
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
    if (this.suggestHandler.isSearch) {
      const searchSuggestItem: suggestItem = {
        type: { iconType: 'search', color: 'tint8' },
        label: inputValue,
      };
      return searchSuggestItem;
    }
  }

  makeSearch(item:suggestItem):void {
    const { inputValue, filters:currentFilters } = this.state;
    const filters = {...currentFilters};

    filters['search'] = inputValue;
    this.updateFilters(filters);
    this.setState({
      inputValue: '',
      suggestions: [],
      isProcessing: true,
      filters,
    });
  }

  makeFilter(item:suggestItem):void {
    const { inputValue, filters } = this.state;
      
    const {inputValue:newInputValue, filters:newFilters } = this.suggestHandler.onItemClick(item, inputValue, filters);
    this.updateFilters(newFilters);
    
    this.setState({
      inputValue: newInputValue,
      suggestions: [],
      filters: newFilters,
      isProcessing: true,
    });
  }

  updateFilters(newFilters:object):void {
    const { filters } = this.state;
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      this.props.onInputChange(newFilters);
    }
  }
  //#region Event methods

  onInputChange = (value:string) => {
    const { filters:currentFilters } = this.state;
    const { isInvalid, filters } = this.suggestHandler.onInputChange(value, currentFilters);

    this.updateFilters(filters);
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
    const { inputValue, filters } = this.state;
    const { searchDisable } = this.props;
    if (this.suggestHandler.isSearch && !searchDisable) {
      filters['search'] = inputValue;
      this.setState({inputValue:'', isProcessing: true});
    } else if(inputValue.length > 0) {
      filters['q'] = inputValue;
    }
    this.props.onInputChange(filters);
    this.setState({filters})
  }

  onItemClick(item: suggestItem) {
    if (item.type.iconType === 'search') {
      this.makeSearch(item);
    } else {
      this.makeFilter(item);
    }
  }

  onDeleteBadge(badge) {
    const { filters } = this.state;
    delete filters[badge.field];
    this.props.onInputChange(filters);
    this.setState({filters});
  }

  //#endregion

  //#region Renderer methods

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

  //#endregion
}
