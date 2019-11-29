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
    isSearch: boolean
    lastField?: string
    lastOperator?: string
    isInvalid: boolean
    status: string
  }
  props!:{
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
      isSearch: false,
      isInvalid: false,
      status: 'unchanged',
    }
  }

  componentDidMount() {
    this.buildSuggestFields();
  }

  componentDidUpdate() {
    if (this.state.isProcessing && !this.state.isInvalid){
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
    const isSearch = fields.length > 1 ? false : true;
    this.setState({suggestions: fields, isSearch});
  }

  // TODO:
  buildSuggestOperators() {
    this.setState({
      suggestions: [
        {
          type: { iconType: 'kqlOperand', color: 'tint1' },
          label: '=',
          description: 'Equal'
        },
        {
          type: { iconType: 'kqlOperand', color: 'tint1' },
          label: '!=',
          description: 'not equal',
        },
      ]
    })
  }


  onInputChange = (value) => {
    this.setState({
      inputValue: value,
      isProcessing: true,
    });
    this.inputStageHandler(value);
    if(value.length > 10) {
      this.props.onInputChange(value);
    }
    return "asd"
  }
  
  onChangeSearchFormat = (format) => {console.log(format)}
  
  onKeyPress = (e:KeyboardEvent)  => {
    if(e.key === 'Enter') {
      const { isSearch, inputValue } = this.state;
      if (isSearch) {
        this.props.onInputChange({search: inputValue});
      } else {
        this.setState({
          inputStage: 'operators',
          isProcessing: true
        })
      }
    }
  }

  onItemClick(item) {
    const { inputValue } = this.state;
    let inputStage:string = '';
    if (item.type.iconType === 'kqlField') {
      inputStage = 'operators';
    } else if (item.type.iconType === 'kqlOperand') {
      inputStage = 'values';
    }
    this.setState({
      inputValue: inputValue + item.label,
      isProcessing: true,
      inputStage,
    });
  }

  inputStageHandler(inputValue: string) {
    const queries = inputValue.split(/,|;/);
    const lastIndex = queries.length - 1;
    const operators = /=|!=|<|>|~/
    
    if(queries[lastIndex].match(operators)){
      const { qSuggests } = this.props;
      console.log('has operator')
      const {0: field, 1: value} = queries[lastIndex].split(operators);
      const result = qSuggests.find((item) => {return item.label === field})
      if (result)
        console.log('field Exists')
      else
        this.setState({
          isInvalid: true,
          suggestions: [
          {
            type: { iconType: 'alert', color: 'tint2' },
            label: `The field ${field} no exists`,
          }
        ]});
    }else {
      this.setState({inputStage: 'fields',});
    }

  }

  render() {
    const { status, suggestions, inputValue, isInvalid } = this.state;

    return (
      <EuiSuggest
      status={status}
        value={inputValue}
        onKeyPress={this.onKeyPress}
        onItemClick={this.onItemClick.bind(this)}
        append={<WzSearchFormatSelector onChange={this.onChangeSearchFormat}/>}
        suggestions={suggestions}
        onInputChange={this.onInputChange}
        isInvalid={isInvalid}
      />
    );
  }
}
