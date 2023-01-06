/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import { getFilterValues } from './lib';
import { IFilter, IWzSuggestItem, WzSearchBar } from '../../../../components/wz-search-bar';
import { ICustomBadges } from '../../../wz-search-bar/components';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { formatUIDate } from '../../../../react-services/time-service';

export class FilterBar extends Component {
  // TODO: Change the type
  suggestions: { [key: string]: IWzSuggestItem[] } = {
    files: [
      {
        type: 'q',
        label: 'file',
        description: 'Name of the file',
        operators: ['=', '!=', '~'],
        values: async (value) =>
          getFilterValues('file', value, this.props.agent.id, { type: 'file' }),
      },
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'perm',
              description: 'Permissions of the file',
              operators: ['=', '!=', '~'],
              values: async (value) => getFilterValues('perm', value, this.props.agent.id),
            },
          ]
        : []),
      {
        type: 'q',
        label: 'mtime',
        description: 'Date the file was modified',
        operators: ['=', '!=', '>', '<'],
        values: async (value) =>
          getFilterValues('mtime', value, this.props.agent.id, {}, formatUIDate),
      },
      {
        type: 'q',
        label: 'date',
        description: 'Date of registration of the event',
        operators: ['=', '!=', '>', '<'],
        values: async (value) =>
          getFilterValues('date', value, this.props.agent.id, {}, formatUIDate),
      },
      {
        type: 'q',
        label: 'uname',
        description: 'Owner of the file',
        operators: ['=', '!=', '~'],
        values: async (value) => getFilterValues('uname', value, this.props.agent.id),
      },
      {
        type: 'q',
        label: 'uid',
        description: 'Id of the owner file',
        operators: ['=', '!=', '~'],
        values: async (value) => getFilterValues('uid', value, this.props.agent.id),
      },
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'gname',
              description: 'Name of the group owner file',
              operators: ['=', '!=', '~'],
              values: async (value) => getFilterValues('gname', value, this.props.agent.id),
            },
          ]
        : []),
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'gid',
              description: 'Id of the group owner',
              operators: ['=', '!=', '~'],
              values: async (value) => getFilterValues('gid', value, this.props.agent.id),
            },
          ]
        : []),
      {
        type: 'q',
        label: 'md5',
        description: 'md5 hash',
        operators: ['=', '!=', '~'],
        values: async (value) => getFilterValues('md5', value, this.props.agent.id),
      },
      {
        type: 'q',
        label: 'sha1',
        description: 'sha1 hash',
        operators: ['=', '!=', '~'],
        values: async (value) => getFilterValues('sha1', value, this.props.agent.id),
      },
      {
        type: 'q',
        label: 'sha256',
        description: 'sha256 hash',
        operators: ['=', '!=', '~'],
        values: async (value) => getFilterValues('sha256', value, this.props.agent.id),
      },
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'inode',
              description: 'Inode of the file',
              operators: ['=', '!=', '~'],
              values: async (value) => getFilterValues('inode', value, this.props.agent.id),
            },
          ]
        : []),
      {
        type: 'q',
        label: 'size',
        description: 'Size of the file in Bytes',
        values: async (value) => getFilterValues('size', value, this.props.agent.id),
      },
    ],
    registry: [
      {
        type: 'q',
        label: 'file',
        description: 'Name of the registry_key',
        operators: ['=', '!=', '~'],
        values: async (value) =>
          getFilterValues('file', value, this.props.agent.id, { q: 'type=registry_key' }),
      },
    ],
  };

  props!: {
    onFiltersChange(filters: IFilter[]): void;
    selectView: 'files' | 'registry';
    agent: { id: string; agentPlatform: string };
    onChangeCustomBadges?(customBadges: ICustomBadges[]): void;
    customBadges?: ICustomBadges[];
    filters: IFilter[];
  };

  render() {
    const { onFiltersChange, selectView, filters } = this.props;
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzSearchBar
            noDeleteFiltersOnUpdateSuggests
            filters={filters}
            onFiltersChange={onFiltersChange}
            suggestions={this.suggestions[selectView]}
            placeholder="Filter or search file"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}
