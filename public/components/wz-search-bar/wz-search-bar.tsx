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
import { WzSearchFormatSelector } from './wz-search-format-selector'

interface suggestItem {
  type: {iconType: string, color: string }
  label: string
  description?: string
}

interface qSuggests {
  label: string
  description: string
  operators?: string[]
  values: Function | []
}

export default class WzSearchBar extends Component {
  state: {
    searchFormat: string
    suggestions: suggestItem[]
    isProcessing: boolean
    inputStage: string
    inputValue: string
  }
  props!:{
    status: string
    qSuggests: suggestItem[]
    onInputChange: Function
  }

  constructor(props) {
    super(props);
    this.state = {
      searchFormat: '?Q',
      suggestions: [],
      isProcessing: false,
      inputStage: 'fields',
      inputValue: '',
    }
  }

  componentDidMount() {
    this.buildSuggestFields();
  }

  componentDidUpdate() {
    if (this.state.isProcessing){
      const { inputStage,  } = this.state;
      if (inputStage === 'fields'){
        this.buildSuggestFields();
      } else if (inputStage === 'operators') {
        this.buildSuggestOperators();
      }
      this.setState({isProcessing: false});
    }
  }


  buildSuggestFields() {
    const { searchFormat, inputValue } = this.state;
    const { qSuggests } = this.props
    const rawfields = searchFormat === '?Q' 
      ? qSuggests
      : [];

    const fields = rawfields
    .filter((item) => {
      return item.label.includes(inputValue);
    })
    .map((item) => {
      const field = {
        type: { iconType: 'kqlField', color: 'tint4' },
        label: item.label,
      };

      if (item.description) {
        field['description'] = item.description;
      }
      return field;
    })
    if (inputValue != '') {
      fields.unshift({
        type: { iconType: 'search', color: 'tint8' },
        label: inputValue,
      });
    }
    this.setState({suggestions: fields});
  }

  // TODO:
  buildSuggestOperators() {
    this.setState({
      suggestions: [
        {
          type: { iconType: 'kqlOperand', color: 'tint1' },
          label: 'equal',
        },
        {
          type: { iconType: 'kqlOperand', color: 'tint1' },
          label: 'not equal',
        },
      ]
    })
  }


  onInputChange = (value) => {
    this.setState({
      inputValue: value,
      isProcessing: true,
    });
    if(value.length > 10) {
      this.props.onInputChange(value);
    }
  }
  
  onChangeSearchFormat = (format) => {console.log(format)}
  
  onKeyPress = (e:KeyboardEvent)  => {
    if(e.key === 'Enter') {
      this.setState({
        inputStage: 'operators',
        isProcessing: true
      })
    }
  }

  render() {
    const { status } = this.props
    const { suggestions } = this.state;

    return <EuiSuggest
      status={status}
      onKeyPress={this.onKeyPress}
      onItemClick={() => {}}
      append={<WzSearchFormatSelector onChange={this.onChangeSearchFormat}/>}
      suggestions={suggestions}
      onInputChange={this.onInputChange}
    />;
  }
}
