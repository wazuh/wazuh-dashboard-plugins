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
import { QInterpreter, queryObject } from './lib/q-interpreter'

interface suggestItem {
  type: {iconType: string, color: string }
  label: string
  description?: string
}

interface qSuggests {
  label: string
  description: string
  operators?: string[]
  values: Function | [] | undefined
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
    currentField: string | null
  };
  props!:{
    qSuggests: qSuggests[]
    onInputChange: Function
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
      searchFormat: '?Q',
      suggestions: [],
      isProcessing: false,
      inputStage: 'fields',
      inputValue: '',
      isSearch: false,
      isInvalid: false,
      status: 'unchanged',
      currentField: null,
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
      } else if (inputStage === 'values') {
        this.buildSuggestValues();
      } else if (inputStage === 'conjuntions'){
        this.buildSuggestConjuntions();
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
    const qInterpreter = new QInterpreter(inputValue);
    const { field } = qInterpreter.lastQuery();
    const fields = rawfields
    .filter((item) => {
      return item.label.includes(field);
    })
    .map((item) => {
      const suggestItem = {
        type: { iconType: 'kqlField', color: 'tint4' },
        label: item.label,
      };

      if (item.description) {
        suggestItem['description'] = item.description;
      }
      return suggestItem;
    })
    
    if (inputValue != '' && qInterpreter.qNumber() <= 1) {
      fields.unshift({
        type: { iconType: 'search', color: 'tint8' },
        label: inputValue,
      });
    }
    const isSearch = fields.length > 1 ? false : true;
    this.setState({suggestions: fields, isSearch});
  }

  buildSuggestOperators() {
    const { operators=false } = this.getCurrentField();
    const operatorsAllow = operators 
      ? operators 
      : [...Object.keys(this.operators)];
    const suggestions:suggestItem[] = operatorsAllow.map(this.CreateSuggestOperator);

    this.setState({
      suggestions
    })
  }

  getLastQuery():queryObject {
    const { inputValue }= this.state;
    const qInterperter = new QInterpreter(inputValue);
    return qInterperter.lastQuery();
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

  buildSuggestValues() {
    const { field } = this.getLastQuery();
    if (field) {
      const {values} = this.getCurrentField();
      if(typeof values === 'function') {

      } else {
        const suggestions:suggestItem[] = []
        for (const value of values || []) {
          const item:suggestItem = {
            type: {iconType: 'kqlValue', color: 'tint0'},
            // @ts-ignore
            label: typeof value !== 'string' ? value.toString(): value,
          }
          suggestions.push(item);
        }
        this.setState({suggestions});
      }
    }
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
      suggestions
    })
  }

  onInputChange = (value) => {
    this.setState({
      inputValue: value,
      isProcessing: true,
    });
    this.inputStageHandler(value);
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

  onItemClick(item: suggestItem) {
    const { inputValue } = this.state;
    const qInterperter = new QInterpreter(inputValue);
    let inputStage:string = '';
    if (item.type.iconType === 'kqlField') {
      qInterperter.setlastQuery(item.label);
      inputStage = 'operators';
    } else if (item.type.iconType === 'kqlOperand') {
      qInterperter.setlastQuery(item.label);
      inputStage = 'values';
    } else if (item.type.iconType === 'kqlValue') {
      qInterperter.setlastQuery(item.label);
      this.props.onInputChange({q:qInterperter.toString()});
      inputStage = 'conjuntions';
    } else if (item.type.iconType === 'kqlSelector') {
      qInterperter.addNewQuery(item.label);
      inputStage = 'fields';
    } else if (item.type.iconType === 'search') {
      this.props.onInputChange({search: inputValue});
    }
    this.setState({
      inputValue: qInterperter.toString(),
      isProcessing: true,
      currentField: 'status',
      inputStage,
    });
  }

  inputStageHandler(inputValue: string) {
    const qInterpreter = new QInterpreter(inputValue);

    const {field, value=false } = qInterpreter.lastQuery()
    if(value !== false) {
      const { qSuggests } = this.props;
      const result = qSuggests.find((item) => {return item.label === field})
      if (result) {
        this.setState({
          isInvalid: false,
          inputStage: 'values',
          currentField: field
        });
      } else {
        this.setState({
          isInvalid: true,
          currentField: null,
          suggestions: [{
            type: { iconType: 'alert', color: 'tint2' },
            label: `The field ${field} no exists`,
          }]
        });
      }
    } else {
      this.setState({
        isInvalid: false,
        inputStage: 'fields',
        currentField: null,
      });
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
