/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { WzSearchBar, qSuggests } from '../../../../components/wz-search-bar'
import { getFilterValues } from './lib';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSuperDatePicker,
  OnTimeChangeProps,
} from '@elastic/eui';
//@ts-ignore
import {  getServices } from 'plugins/kibana/discover/kibana_services';

interface IDiscoverTime { from:string, to:string };

export class FilterBar extends Component {
  suggestions: {[key:string]: qSuggests[]} = {
    files: [
      {label: 'file', description:"Name of the file or registry", operators:['=','!=', '~'], values: async (value) => getFilterValues('file', value)},
      {label: 'perm', description:"Permisions of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('perm', value)},
      {label: 'uname', description:"Owner of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('uname', value)},
      {label: 'uid', description:"Id of the onwner file", operators:['=','!=', '~'], values: async (value) => getFilterValues('uid', value)},
      {label: 'gname', description:"Name of the group owner file", operators:['=','!=', '~'], values: async (value) => getFilterValues('gname', value)},
      {label: 'gid', description:"Id of the group owner", operators:['=','!=', '~'], values: async (value) => getFilterValues('gid', value)},
      {label: 'md5', description:"", operators:['=','!=', '~'], values: async (value) => getFilterValues('md5', value)},
      // {label: 'date', values: async (value) => getFilterValues('date', value)},
      {label: 'sha1', description:"", operators:['=','!=', '~'], values: async (value) => getFilterValues('sha1', value)},
      {label: 'sha256', description:"", operators:['=','!=', '~'], values: async (value) => getFilterValues('sha256', value)},
      // {label: 'mtime', values: async (value) => getFilterValues('mtime', value)},
      {label: 'inode', description:"", operators:['=','!=', '~'], values: async (value) => getFilterValues('inode', value)},
      {label: 'size', description:"Size of the file in Bytes", values: value => !!value ? [value] : [0]}, // TODO: Adapt code to return and array with description
    ],
    registry: [
      {label: 'file', description:"Name of the file or registry", values: async (value) => getFilterValues('file', value)},
    ]
  }

  commonDurationRanges = [
    {"start":"now/d","end":"now/d","label":"Today"},
    {"start":"now/w","end":"now/w","label":"This week"},
    {"start":"now-15m","end":"now","label":"Last 15 minutes"},
    {"start":"now-30m","end":"now","label":"Last 30 minutes"},
    {"start":"now-1h","end":"now","label":"Last 1 hour"},
    {"start":"now-24h","end":"now","label":"Last 24 hours"},
    {"start":"now-7d","end":"now","label":"Last 7 days"},
    {"start":"now-30d","end":"now","label":"Last 30 days"},
    {"start":"now-90d","end":"now","label":"Last 90 days"},
    {"start":"now-1y","end":"now","label":"Last 1 year"},
  ]

  timefilter: {
    getTime(): IDiscoverTime
    setTime(time:IDiscoverTime): void
    _history: {history:{items:{from:string, to:string}[]}}
  };

  state: {
    datePicker: OnTimeChangeProps,
    filterBar: {}
  }

  props!:{
    onFiltersChange: Function
    onDateChange(props:OnTimeChangeProps):() => void,
    selectView: 'files' | 'registry'
  }

  constructor(props) {
    super(props);
    this.timefilter = getServices().timefilter;
    const { from, to } = this.timefilter.getTime();
    this.state = {
      datePicker: {
        start: from, 
        end: to,
        isQuickSelection: true,
        isInvalid: false,
      },
      filterBar: {}
    }
    this.onTimeChange.bind(this);
  }

  onTimeChange = (datePicker: OnTimeChangeProps) => {
    const {start:from, end:to} = datePicker;
    this.setState({datePicker});
    this.timefilter.setTime({from, to});
    this.props.onDateChange(datePicker);
  }

  render() {
    const { datePicker } = this.state;
    const { onFiltersChange, selectView } = this.props;
    const recentlyUsedRanges = this.timefilter._history.history.items.map(
      item => ({start:item.from, end: item.to})
    );
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzSearchBar
            onInputChange={onFiltersChange}
            qSuggests={this.suggestions[selectView]}
            apiSuggests={null}
            defaultFormat='qTags'
            placeholder='Add filter or search' />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSuperDatePicker 
            commonlyUsedRanges={this.commonDurationRanges} 
            recentlyUsedRanges={recentlyUsedRanges}
            onTimeChange={this.onTimeChange}
            {...datePicker} />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
}