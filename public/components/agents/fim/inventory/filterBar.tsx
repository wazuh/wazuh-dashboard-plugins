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
} from '@elastic/eui';
import { ICustomBadges } from '../../../wz-search-bar/components';

export class FilterBar extends Component {
  // TODO: Change the type
  suggestions: {[key:string]: any[]} = {
    files: [
      {type: 'q', label: 'file', description:"Name of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('file', value, this.props.agent.id, {type:'file'})},
      ...(this.props.agent.agentPlatform !== 'windows' ? [{type: 'q', label: 'perm', description:"Permisions of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('perm', value, this.props.agent.id)}]: []),
      {type: 'q', label: 'mtime', description:"Date the file was modified", operators:['=','!=', '>', '<'], values: async (value) => getFilterValues('mtime', value, this.props.agent.id)},
      {type: 'q', label: 'date', description:"Date of registration of the event", operators:['=','!=', '>', '<'], values: async (value) => getFilterValues('date', value, this.props.agent.id)},
      {type: 'params', label: 'uname', description:"Owner of the file",/*  operators:['=','!=', '~'], */ values: async (value) => getFilterValues('uname', value, this.props.agent.id)},
      {type: 'q', label: 'uid', description:"Id of the onwner file", operators:['=','!=', '~'], values: async (value) => getFilterValues('uid', value, this.props.agent.id)},
      ...(this.props.agent.agentPlatform !== 'windows' ? [{type: 'q', label: 'gname', description:"Name of the group owner file", operators:['=','!=', '~'], values: async (value) => getFilterValues('gname', value, this.props.agent.id)}]: []),
      ...(this.props.agent.agentPlatform !== 'windows' ? [{type: 'q', label: 'gid', description:"Id of the group owner", operators:['=','!=', '~'], values: async (value) => getFilterValues('gid', value, this.props.agent.id)}]: []),
      {type: 'q', label: 'md5', description:"md5 hash", operators:['=','!=', '~'], values: async (value) => getFilterValues('md5', value, this.props.agent.id)},
      {type: 'q', label: 'sha1', description:"sha1 hash", operators:['=','!=', '~'], values: async (value) => getFilterValues('sha1', value, this.props.agent.id)},
      {type: 'q', label: 'sha256', description:"sha256 hash", operators:['=','!=', '~'], values: async (value) => getFilterValues('sha256', value, this.props.agent.id)},
      ...(this.props.agent.agentPlatform !== 'windows' ? [{type: 'q', label: 'inode', description:"Inode of the file", operators:['=','!=', '~'], values: async (value) => getFilterValues('inode', value, this.props.agent.id)}]: []),
      {type: 'q', label: 'size', description:"Size of the file in Bytes", values: value => !!value ? [value] : [0]}, // TODO: Adapt code to return and array with description
    ],
    registry: [
      {type: 'q', label: 'file', description:"Name of the registry", operators:['=','!=', '~'], values: async (value) => getFilterValues('file', value, this.props.agent.id, {type:'registry'})},
    ]
  }

  state: {
    filterBar: {}
  }

  props!:{
    onFiltersChange: Function
    selectView: 'files' | 'registry'
    agent: {id: string, agentPlatform: string}
    onChangeCustomBadges?(customBadges: ICustomBadges[]): void 
    customBadges?: ICustomBadges[]
    filters: {}[]
  }

  constructor(props) {
    super(props);
    this.state = {
      filterBar: {}
    }
  }

  render() {
    const { onFiltersChange, selectView, filters, onChangeCustomBadges, customBadges } = this.props;
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzSearchBar
            noDeleteFiltersOnUpdateSuggests
            filters={filters}
            onFiltersChange={onFiltersChange}
            suggestions={this.suggestions[selectView]}
            apiSuggests={null}
            defaultFormat='?Q'
            placeholder='Add filter or search'
            customBadges={customBadges}
            onChangeCustomBadges={onChangeCustomBadges} />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
}