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
import { ContextMenu } from './components/wz-search-badges';
import { qSuggests } from '.';
import './src/style/wz-search-badges.less'


interface iFilter { field:string, value:string }

export interface Props {
  filters: iFilter[]
  onChange: (badge) => void
}

export class WzSearchBadges extends Component {
  props!: {
    filters: iFilter[]
    onChange: Function
    qSuggests: qSuggests[]
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
        className="globalFilterItem wz-search-badge"
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
    const { qSuggests } = this.props;
    return <EuiBadge className="wz-search-badge" key={index} iconType="cross" 
      iconSide="right" color="hollow" iconOnClickAriaLabel="Remove" 
      iconOnClick={() => {this.deleteFilter(qInterpreter, index);} }>
        <ContextMenu qFilter={qFilter} index={index} qInterpreter={qInterpreter} 
        deleteFilter={() => this.deleteFilter(qInterpreter, index)} 
        changeConjuntion={() => this.changeConjuntion(qInterpreter, index)}
        invertOperator={() => this.invertOperator(qInterpreter, index)}
        updateFilters={() => this.updateFilters(qInterpreter)}
        qSuggest={qSuggests.find(item => item.label === qFilter.field)}
        />
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

  private changeConjuntion(qInterpreter: QInterpreter, index: number){
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

