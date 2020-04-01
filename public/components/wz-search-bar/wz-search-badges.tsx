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

import React, {
  Component, useState
} from 'react';
import { EuiBadge } from '@elastic/eui';
import { QInterpreter, queryObject } from './lib/q-interpreter';
import {
  EuiButtonEmpty,
  EuiPopover,
  EuiContextMenu,
  EuiForm,
  EuiFormRow,
  EuiSuperSelect,
  EuiButtonGroup,
  EuiFieldText,
  EuiButton,
} from '@elastic/eui';

interface iFilter { field:string, value:string }

export interface Props {
  filters: iFilter[]
  onChange: (badge) => void
}

function flattenPanelTree(tree, array = []) {
  array.push(tree);

  if (tree.items) {
    tree.items.forEach(item => {
      if (item.panel) {
        flattenPanelTree(item.panel, array);
        item.panel = item.panel.id;
      }
    });
  }

  return array;
}

function EditFilter(props) {
  const query = props.qInterpreter.getQuery(props.index);
  const [conjuntion, setConjuntion] = useState(query.conjuntion);
  const [operator, setOperator] = useState(query.operator);
  const [value, setValue] = useState(query.value);
  return <EuiForm>
    {conjuntion && 
    <EuiFormRow label="Conjuntion">
        <EuiButtonGroup 
          options={[
            {id: `conjuntion;`, label:"AND"},
            {id: `conjuntion,`, label:"OR"},
            ]}
          idSelected={`conjuntion${conjuntion}`}
          onChange={() => setConjuntion(conjuntion === ';' ? ',' : ';')}/>
    </EuiFormRow>}
    <EuiFormRow label="Operator">
      <EuiSuperSelect
        options={[
          {value: '=', inputDisplay: 'is'},
          {value: '!=', inputDisplay: 'is not'},
          {value: '<', inputDisplay: 'less than'},
          {value: '>', inputDisplay: 'greater than'},
          {value: '~', inputDisplay: 'like'},
        ]}
        valueOfSelected={operator}
        onChange={setOperator}
      />
    </EuiFormRow>
    <EuiFormRow label="Value">
      <EuiFieldText
        value={value}
        onChange={setValue} />
    </EuiFormRow>
    <EuiButton 
      fill={true}
      onClick={() => {
        const newFilter = {field: query.field, operator, value};
        conjuntion && (newFilter['conjuntion'] = conjuntion);
        props.qInterpreter.editByIndex(props.index, newFilter);
        props.updateFilters();
      }} >
      Save
    </EuiButton>
  </EuiForm>;
}
const panelTree = (props) => {
  const panels = {
    id: 0,
    items: [
      { 
        name: 'Edit filter',
        icon: 'pencil',
        panel: {
          id: 1,
          title: 'Edit filter',
          content: <EditFilter {...props} />
        }
      },
      {
        name: 'Delete filter',
        icon: 'trash',
        onClick: props.deleteFilter
      },
    ]
  }
  props.qFilter.operator !== '~' && panels.items.unshift({
      name: 'Invert operator',
      icon: 'kqlOperand',
      onClick: props.invertOperator
    })
  !!props.qFilter.conjuntion && panels.items.unshift({
      name: 'Change conjuntion',
      icon: 'kqlSelector',
      onClick: props.changeConjuntuion
    })
  return panels;
}

function PopOver(props) {
  const [isOpen, setIsOpen] = useState(false);
  const panels = flattenPanelTree(panelTree(props));
  const conjuntions = {';': 'AND ', ',': 'OR '}
  const operators = {'=': ' is ', '!=': ' is not ', '<': ' less than ', '>': ' greater than ', '~': ' like '}
  const { conjuntion=false, field, value, operator } = props.qFilter;
  const button = (<EuiButtonEmpty color='text' size="xs" onClick={() => setIsOpen(!isOpen)}>
    <strong>{conjuntion && conjuntions[conjuntion]}</strong> {field} {operators[operator]} {value}
  </EuiButtonEmpty>)
  return (<EuiPopover button={button} isOpen={isOpen} closePopover={() => setIsOpen(false)}>
    <EuiContextMenu initialPanelId={0} panels={panels} />
  </EuiPopover>);
}


export class WzSearchBadges extends Component {
  props!: {
    filters: iFilter[]
    onChange: Function
  }
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.filters.lenght !== this.props.filters.length) {
      return true;
    }
    return false;
  }

  
  idGenerator() {
    return '_' + Math.random().toString(36).substr(2, 9)
  }

  buildBadge(filter:iFilter, index:number) {
    if (filter.field === 'q') { return this.buildQBadges(filter); }
    return (
      <EuiBadge
        key={index}
        iconType="cross"
        iconSide="right"
        iconOnClickAriaLabel="Remove"
        color="hollow"
        className="globalFilterItem"
        iconOnClick={() => this.onDeleteFilter(filter)}>
        {`${filter.field}:${filter.value}`}
      </EuiBadge>
    );
  }


  buildQBadges(filter:iFilter) {
    const qInterpreter = new QInterpreter(filter.value);
    const qBadges = qInterpreter.queryObjects.map((qFilter,index) => (
      this.buildQBadge(qInterpreter, index, qFilter)
    ));
    return qBadges;
  }



  private buildQBadge(qInterpreter, index, qFilter): JSX.Element {
    return <EuiBadge key={index} iconType="cross" iconSide="right" 
      color="hollow" iconOnClickAriaLabel="Remove" iconOnClick={() => {
      this.deleteFilter(qInterpreter, index);
    } }>
      <PopOver qFilter={qFilter} index={index} qInterpreter={qInterpreter} 
      deleteFilter={() => this.deleteFilter(qInterpreter, index)} 
      changeConjuntuion={() => this.changeConjuntuion(qInterpreter, index)}
      invertOperator={() => this.invertOperator(qInterpreter, index)}
      updateFilters={() => this.updateFilters(qInterpreter)} />
    </EuiBadge>;
  }

  private updateFilters(qInterpreter:QInterpreter) {
    const filters = {
      ...this.filtersToObject(),
      q: qInterpreter.toString(),
    }
    this.props.onChange(filters);
  }

  private deleteFilter(qInterpreter: QInterpreter, index: number) {
    qInterpreter.deleteByIndex(index);
    if (qInterpreter.qNumber() > 0) {
      const filters = {
        ...this.filtersToObject(),
        q: qInterpreter.toString()
      };
      this.props.onChange(filters);
    }
    else {
      this.onDeleteFilter({ field: 'q', value: '' });
    }
  }

  private changeConjuntuion(qInterpreter: QInterpreter, index: number){
    const oldQuery = qInterpreter.getQuery(index)
    const newQuery:queryObject = { 
      ...oldQuery,
      conjuntion: oldQuery.conjuntion === ';' ? ',' : ';',
    };
    qInterpreter.editByIndex(index, newQuery);
    const filters = {
      ...this.filtersToObject(),
      q: qInterpreter.toString(),
    }
    this.props.onChange(filters);
  }

  private invertOperator(qInterpreter: QInterpreter, index: number){
    const oldQuery = qInterpreter.getQuery(index)
    let newOperator = '=';
    switch (oldQuery.operator) {
      case '!=': newOperator = '='; break;
      case '=': newOperator = '!='; break;
      case '<': newOperator = '>'; break;
      case '>': newOperator = '<'; break;
      case '~': newOperator = '~'; break;
    }
    const newQuery:queryObject = { 
      ...oldQuery,
      //@ts-ignore
      operator: newOperator,
    };
    qInterpreter.editByIndex(index, newQuery);
    const filters = {
      ...this.filtersToObject(),
      q: qInterpreter.toString(),
    }
    this.props.onChange(filters);
  }

  filtersToObject() {
    const filters = {}
    for (const f of this.props.filters) {
      filters[f.field] = f.value;
    }
    return filters;
  }

  onDeleteFilter(filter) {
    const filters = this.filtersToObject();
    delete filters[filter.field]
    this.props.onChange(filters);
  }

  render() {
    const { filters } = this.props;
    const badges = filters.map((item, index) => this.buildBadge(item, index))
    return (
      <div
        data-testid="search-badges" >
        {badges}
      </div>
    );
  }
}

