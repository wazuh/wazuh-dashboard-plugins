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
  OnTimeChangeProps,
} from '@elastic/eui';

export class FilterBar extends Component {
  suggestions: {[key:string]: qSuggests[]} = {
    files: [
      {label: 'file', description:"Name of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('file', value, this.props.agentId, {type:'file'})},
      {label: 'perm', description:"Permisions of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('perm', value, this.props.agentId)},
      {label: 'uname', description:"Owner of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('uname', value, this.props.agentId)},
      {label: 'uid', description:"Id of the onwner file", operators:['=','!=', '~'], values: async (value) => getFilterValues('uid', value, this.props.agentId)},
      {label: 'gname', description:"Name of the group owner file", operators:['=','!=', '~'], values: async (value) => getFilterValues('gname', value, this.props.agentId)},
      {label: 'gid', description:"Id of the group owner", operators:['=','!=', '~'], values: async (value) => getFilterValues('gid', value, this.props.agentId)},
      {label: 'md5', description:"md5 hash", operators:['=','!=', '~'], values: async (value) => getFilterValues('md5', value, this.props.agentId)},
      // {label: 'date', values: async (value) => getFilterValues('date', value, this.props.agentId)},
      {label: 'sha1', description:"sha1 hash", operators:['=','!=', '~'], values: async (value) => getFilterValues('sha1', value, this.props.agentId)},
      {label: 'sha256', description:"sha256 hash", operators:['=','!=', '~'], values: async (value) => getFilterValues('sha256', value, this.props.agentId)},
      // {label: 'mtime', values: async (value) => getFilterValues('mtime', value, this.props.agentId)},
      {label: 'inode', description:"Inode of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('inode', value, this.props.agentId)},
      {label: 'size', description:"Size of the file in Bytes", values: value => !!value ? [value] : [0]}, // TODO: Adapt code to return and array with description
    ],
    registry: [
      {label: 'file', description:"Name of the registry", operators:['=','!=', '~'], values: async (value) => getFilterValues('file', value, this.props.agentId, {type:'registry'})},
    ]
  }

  state: {
    filterBar: {}
  }

  props!:{
    onFiltersChange: Function
    onTimeChange(props:OnTimeChangeProps):() => void
    selectView: 'files' | 'registry'
    agentId: string
  }

  constructor(props) {
    super(props);
    this.state = {
      filterBar: {}
    }
  }

  render() {
    const { onFiltersChange, selectView, onTimeChange } = this.props;
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzSearchBar
            onInputChange={onFiltersChange}
            qSuggests={this.suggestions[selectView]}
            apiSuggests={null}
            defaultFormat='qTags'
            placeholder='Add filter or search'
            onTimeChange={onTimeChange} />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
}