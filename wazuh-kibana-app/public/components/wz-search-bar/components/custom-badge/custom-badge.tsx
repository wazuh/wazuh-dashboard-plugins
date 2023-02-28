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

import React, {useState, useEffect} from 'react'
import { ContextMenu } from '../';
import { QInterpreter, queryObject } from '../../lib/q-interpreter';
import { EuiBadge } from '@elastic/eui';

export interface ICustomBadges {
  field: string,
  value: string | number | boolean,
  label?: string
}

export function CustomBadge(props) {
  const {badge, index, onChangeCustomBadges, customBadges, qSuggests } = props;
  const qInterpreter = new QInterpreter(badge.value);
  const [ filter, setFilter ] = useState(qInterpreter.lastQuery());
  useEffect(() => {
    const { conjuntion='', field, operator, value} = filter;
    const newBadge: ICustomBadges = {
      ...badge,
      value: `${conjuntion}${field}${operator}${value}`
    }
    const newBadges = [...(customBadges || [])]
    newBadges[index] = newBadge;
    onChangeCustomBadges(newBadges)
   }, [filter]);
  addOrRemoveConjuntion(filter, setFilter, props);
  return (
    <EuiBadge className="wz-search-badge" iconType="cross"
      iconSide="right" color="hollow" iconOnClickAriaLabel="Remove"
      iconOnClick={() => deleteBadge(props)}>
      <ContextMenu qFilter={filter} index={index} qInterpreter={qInterpreter}
        deleteFilter={() => deleteBadge(props)}
        changeConjuntion={() => changeConjution(filter, setFilter)}
        invertOperator={() => invertOperator(filter, setFilter)}
        updateFilters={(args) => setFilter(args)}
        qSuggest={qSuggests.find(item => item.label === filter.field)} />
    </EuiBadge>
  )
}

function addOrRemoveConjuntion(filter, setFilter, props) {
  const {index, filters, } = props;
  if (filter.conjuntion) {
    const {field, operator, value} = filter;
    (!index && !filters['q']) && setFilter({field, operator, value})
  } else {
    (index || filters['q']) &&
    setFilter({...filter, conjuntion: ' AND '});
  }
}

function changeConjution(filter: queryObject, setFilter) {
  const newFilter:queryObject = {
    ...filter, 
    conjuntion: filter.conjuntion === ' AND ' ? ' OR ' : ' AND ',
  }
  setFilter(newFilter);
}

function invertOperator(filter: queryObject, setFilter) {
  let newOperator;
  switch (filter.operator) {
    case '!=': newOperator = '='; break;
    case '=': newOperator = '!='; break;
    case '<': newOperator = '>'; break;
    case '>': newOperator = '<'; break;
    case '~': newOperator = '~'; break;
  }
  const newFilter: queryObject = {
    ...filter,
    operator: newOperator
  }
  setFilter(newFilter);
}

function deleteBadge(props) {
  const {index, onChangeCustomBadges, customBadges:oldCustomBadges} = props;
  const customBadges = [...oldCustomBadges];
  customBadges.splice(index, 1);
  onChangeCustomBadges(customBadges);
}
