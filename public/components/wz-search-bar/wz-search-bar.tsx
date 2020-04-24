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
import React, { Component, KeyboardEvent } from 'react';
import { EuiSuggest } from '../eui-suggest';
import { WzDatePicker } from '../wz-date-picker';
import { WzSearchFormatSelector } from './wz-search-format-selector';
import { WzSearchBadges } from './wz-search-badges';
import { EuiFlexGroup, EuiFlexItem, OnTimeChangeProps } from '@elastic/eui';
import { QHandler, qSuggests } from './lib/q-handler';
import { QTagsHandler } from './lib/q-tags-handler';
import { ApiHandler, apiSuggests } from './lib/api-handler';
import { WzSearchButtons, filterButton } from './wz-search-buttons';

export interface suggestItem {
  type: {iconType: string, color: string }
  label: string
  description?: string
}

export class WzSearchBar extends Component {
  state: {
    searchFormat: 'API' | '?Q' | 'qTags'
    suggestions: suggestItem[]
    isProcessing: boolean
    inputValue: string
    lastField?: string
    lastOperator?: string
    isInvalid: boolean
    status: string
    filters: {}
    isPopoverOpen: boolean
  };
  suggestHandler!: QHandler | ApiHandler | QTagsHandler;
  inputRef!: HTMLImageElement;
  props!:{
    qSuggests: qSuggests[] | null
    apiSuggests: apiSuggests[] | null
    onInputChange: Function
    onTimeChange?(props:OnTimeChangeProps): void
    buttonOptions?: filterButton[]
    searchDisable?: boolean
    defaultFormat?: 'API' | '?Q' | 'qTags'
    placeholder?: string
    initFilters?: {}
    noDeleteFiltersOnUpdateSuggests?: boolean
  };

  constructor(props) {
    super(props);
    const searchFormat = this.selectSearchFormat(props);
    this.state = {
      searchFormat,
      suggestions: [],
      isProcessing: true,
      inputValue: '',
      isInvalid: false,
      status: 'unchanged',
      filters: props.initFilters || {},
      isPopoverOpen: false,
    }
  }

  selectSearchFormat(props) {
    const searchFormat = (props.defaultFormat)
    ? props.defaultFormat
    : (!!props.qSuggests)
      ? '?Q'
      : (props.apiSuggests)
        ? 'API'
        : '';

    return searchFormat;
  }

  selectSuggestHandler(searchFormat):void {
    const { noDeleteFiltersOnUpdateSuggests } = this.props;
    const { filters } = this.state;
    switch (searchFormat) {
      case '?Q':
        this.suggestHandler = new QHandler(this.props.qSuggests);
        break;
      case 'qTags':
        this.suggestHandler = new QTagsHandler(this.props.qSuggests);
        break;
      case 'API':
        this.suggestHandler = new ApiHandler(this.props.apiSuggests);
        break;
      default:
        break;
    }

    this.setState({ 
      isProcessing: true, 
      suggestions: [], 
      filters: noDeleteFiltersOnUpdateSuggests
        ? filters
        : {} 
    });
  }

  async componentDidMount() {
    this.props.onInputChange(this.state.filters);
    this.selectSuggestHandler(this.state.searchFormat);
    if(this.state.searchFormat) {
      const suggestsItems = [...await this.suggestHandler.buildSuggestItems('')];
      this.setState({suggestions: suggestsItems});
    }
  }

  updateSuggestOnProps(qSuggestsPrev, apiSuggestsPrev) {
    const { qSuggests, apiSuggests } = this.props;
    const qSuggestsChanged = JSON.stringify(qSuggests) !== JSON.stringify(qSuggestsPrev);
    const apiSuggestsChanged = JSON.stringify(apiSuggests) !== JSON.stringify(apiSuggestsPrev);
    if (qSuggestsChanged || apiSuggestsChanged) {
      return true;
    }
    return false;

  }

  shouldComponentUpdate(nextProps, nextState){
    if(JSON.stringify(this.props.initFilters) !== JSON.stringify(nextProps.initFilters)){
      return true;
    }
    if (nextState.isProcessing) {
      return true;
    }
    if (JSON.stringify(this.props.initFilters) !== JSON.stringify(nextProps.initFilters)){
      return true;
    }
    if (nextState.isPopoverOpen !== this.state.isPopoverOpen){
      return true;
    }
    if (nextState.status !== this.state.status) {
      return true;
    }
    if (this.updateSuggestOnProps(nextProps.qSuggests, nextProps.apiSuggests)){
      return true;
    }
    if (JSON.stringify(this.state.suggestions) !== JSON.stringify(nextState.suggestions)){
      return true;
    }
    return false;
  }

  async componentDidUpdate(prevProps) {
    if(JSON.stringify(this.props.initFilters) !== JSON.stringify(prevProps.initFilters)){
      this.setState({filters: this.props.initFilters});
    }

    if (this.updateSuggestOnProps(prevProps.qSuggests, prevProps.apiSuggests)) {
      this.selectSuggestHandler(this.state.searchFormat);
    }
    if (JSON.stringify(prevProps.initFilters) !== JSON.stringify(this.props.initFilters)){
      this.setState({
        filters: this.props.initFilters,
        isProcessing: true
      })
    }

    if (!this.state.isProcessing) { return;}
    const { inputValue, isInvalid, searchFormat } = this.state;
    if (isInvalid) {
      this.buildSuggestInvalid();
    } else {
      const suggestsItems = !!searchFormat ?
        [...await this.suggestHandler.buildSuggestItems(inputValue)]
        : [];

      if (this.isSearchEnabled()) {
        const suggestSearch = this.buildSuggestFieldsSearch();
        suggestSearch && suggestsItems.unshift(suggestSearch);
      }

      await this.setState({
        status: 'unchanged',
        suggestions: suggestsItems,
        isProcessing: false,
      });
    }
  }

  isSearchEnabled() {
    const { searchFormat} = this.state;
    const { searchDisable } = this.props;
    return ((this.suggestHandler || {}).inputStage === 'fields'
    && !searchDisable)
    || !searchFormat;
  }

  buildSuggestInvalid() {
    const suggestsItems = [{
      type: { iconType: 'alert', color: 'tint2' },
      label: "Error",
      description: "The field are invalid"
    }];
    this.setState({
      isProcessing: false,
      suggestions: suggestsItems,
      status: 'unsaved',
    });
  }

  buildSuggestFieldsSearch():suggestItem | undefined {
    const { inputValue, searchFormat } = this.state;
    if ((this.suggestHandler || {}).isSearch || !searchFormat) {
      const searchSuggestItem: suggestItem = {
        type: { iconType: 'search', color: 'tint8' },
        label: inputValue,
        description: 'Search'
      };
      return searchSuggestItem;
    }
  }

  makeSearch():void {
    const { inputValue, filters:currentFilters } = this.state;
    if ( !inputValue ) { return; }
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
    this.inputRef.focus();
    this.updateFilters(newFilters);

    this.setState({
      inputValue: newInputValue,
      suggestions: [],
      status: 'loading',
      filters: newFilters,
      isProcessing: true,
    });
  }

  updateFilters(newFilters:object):void {
    const { filters } = this.state;
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      this.props.onInputChange(newFilters);
      this.setState({isPopoverOpen:false});
    }
  }

  //#region Event methods

  onInputChange = (value:string) => {
    const { filters:currentFilters } = this.state;
    if (!this.state.searchFormat) {
      this.setState({
        inputValue: value,
        isProcessing: true,
        isPopoverOpen: true
      });
      return;
    }
    const { isInvalid, filters } = this.suggestHandler.onInputChange(value, currentFilters);
    if (!isInvalid) {
      this.updateFilters(filters);
    }
    this.setState({
      inputValue: value,
      isProcessing: true,
      status: 'loading',
      isInvalid,
      isPopoverOpen: true,
      filters
    });
  }

  onChangeSearchFormat(format) {
    this.setState({searchFormat: format});
    this.selectSuggestHandler(format);
  }

  onKeyPress = (e:KeyboardEvent)  => {
    const { isInvalid, searchFormat } = this.state;
    if(e.key !== 'Enter' || isInvalid) {
      return;
    }
    const { inputValue, filters:currentFilters } = this.state;
    const { searchDisable } = this.props;
    let filters = {};
    let newInputValue = '';
    if (((this.suggestHandler || {}).isSearch && !searchDisable)|| !searchFormat) {
      filters = {
        ...currentFilters,
        ...(inputValue && {search: inputValue}),
      };
    } else if(inputValue.length > 0) {
      const { inputValue:newInput, filters:newFilters } = this.suggestHandler.onKeyPress(inputValue, currentFilters);
      filters = {...newFilters};
      newInputValue = newInput;
    }
    this.props.onInputChange(filters);
    this.setState({
      isProcessing: true,
      inputValue: newInputValue,
      filters,
      isPopoverOpen: false
    });
  }

  onItemClick(item: suggestItem) {
    if (item.type.iconType === 'search') {
      this.makeSearch();
    } else {
      this.makeFilter(item);
    }
  }

  onChangeBadge(filters) {
    this.props.onInputChange(filters);
    this.setState({filters, isProcessing: true});
  }

  onPopoverFocus(event) {
    this.setState({isPopoverOpen: true});
  }

  closePopover = () => {
    this.setState({isPopoverOpen: false});
  };

  async onButtonPress(filter) {
    await this.setState(state => ({
      isProcessing: true,
      filters: {
        ...state['filters'],
        ...filter
      },
    }));
    this.props.onInputChange(this.state.filters);
  }

  //#endregion

  //#region Renderer methods

  renderFormatSelector() {
    const { qSuggests, apiSuggests } = this.props;
    const { searchFormat } = this.state;
    if (searchFormat === 'qTags') {
      return;
    }
    const qFilterEnabled = !!qSuggests;
    const apiFilterEnabled = !!apiSuggests;
    if (!qFilterEnabled && !apiFilterEnabled) {
      return null;
    }
    return (<WzSearchFormatSelector
      onChange={this.onChangeSearchFormat.bind(this)}
      format={searchFormat}
      qFilterEnabled={qFilterEnabled}
      apiFilterEnabled={apiFilterEnabled}
    />);
  }

  render() {
    const { status,
      suggestions,
      inputValue,
      isInvalid,
      filters,
      isPopoverOpen
    } = this.state;
    const { placeholder, buttonOptions, qSuggests, onTimeChange } = this.props;
    const formatedFilter = [...Object.keys(filters).map((item) => {return {field: item, value: filters[item]}})];
    const searchFormatSelector = this.renderFormatSelector();
    !!onTimeChange && import('./src/style/wz-date-picker.less');
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem className="wz-search-bar">
            <EuiSuggest
              status={status}
              inputRef={e => {this.inputRef = e}}
              value={inputValue}
              onKeyPress={this.onKeyPress}
              onItemClick={this.onItemClick.bind(this)}
              append={searchFormatSelector}
              isPopoverOpen={isPopoverOpen}
              onClosePopover={this.closePopover.bind(this)}
              onPopoverFocus={this.onPopoverFocus.bind(this)}
              suggestions={suggestions}
              onInputChange={this.onInputChange}
              isInvalid={isInvalid}
              placeholder={placeholder}
            />
          </EuiFlexItem>
          {!!buttonOptions &&
            <EuiFlexItem grow={false}>
              <WzSearchButtons
                options={buttonOptions || []}
                filters={filters}
                onChange={this.onButtonPress.bind(this)} />
            </EuiFlexItem>
          }
          {onTimeChange &&
            <EuiFlexItem grow={false}  className="wz-date-picker">
              <WzDatePicker onTimeChange={onTimeChange} />
            </EuiFlexItem>
          }
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <WzSearchBadges
              filters={formatedFilter}
              onChange={this.onChangeBadge.bind(this)}
              qSuggests={qSuggests} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  //#endregion
}
