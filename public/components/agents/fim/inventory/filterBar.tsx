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
import {
  IFilter,
  IWzSuggestItem,
  WzSearchBar,
} from '../../../../components/wz-search-bar';
import { ICustomBadges } from '../../../wz-search-bar/components';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { formatUIDate } from '../../../../react-services/time-service';
import { i18n } from '@kbn/i18n';
const fileDescp = i18n.translate('components.addModule.guide.fileDescp', {
  defaultMessage: 'Name of the file',
});
const prefileDescp = i18n.translate('components.addModule.guide.prefileDescp', {
  defaultMessage: 'Permissions of the file',
});
const datefileDescp = i18n.translate(
  'components.addModule.guide.datefileDescp',
  {
    defaultMessage: 'Date the file was modified',
  },
);
const regdatefileDescp = i18n.translate(
  'components.addModule.guide.regdatefileDescp',
  {
    defaultMessage: 'Date of registration of the event',
  },
);
const ownerfileDescp = i18n.translate(
  'components.addModule.guide.ownerfileDescp',
  {
    defaultMessage: 'Id of the owner file',
  },
);
const owneridfileDescp = i18n.translate(
  'components.addModule.guide.owneridfileDescp',
  {
    defaultMessage: 'Name of the group owner file',
  },
);
const groupownerfileDescp = i18n.translate(
  'components.addModule.guide.groupownerfileDescp',
  {
    defaultMessage: 'Id of the group owner',
  },
);
const md5Descp = i18n.translate('components.addModule.guide.md5Descp', {
  defaultMessage: 'md5 hash',
});
const sha1Descp = i18n.translate('components.addModule.guide.sha1Descp', {
  defaultMessage: 'sha1 hash',
});
const sha256Descp = i18n.translate('components.addModule.guide.sha256Descp', {
  defaultMessage: 'sha256 hash',
});
const inodeDescp = i18n.translate('components.addModule.guide.inodeDescp', {
  defaultMessage: 'Inode of the file',
});
const sizeDescp = i18n.translate('components.addModule.guide.sizeDescp', {
  defaultMessage: 'Size of the file in Bytes',
});
const regkeyDescp = i18n.translate('components.addModule.guide.regkeyDescp', {
  defaultMessage: 'Name of the registry_key',
});
const filePlace = i18n.translate('components.addModule.guide.filePlace', {
  defaultMessage: 'Filter or search file',
});

export class FilterBar extends Component {
  // TODO: Change the type
  suggestions: { [key: string]: IWzSuggestItem[] } = {
    files: [
      {
        type: 'q',
        label: 'file',
        description: fileDescp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('file', value, this.props.agent.id, { type: 'file' }),
      },
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'perm',
              description: prefileDescp,
              operators: ['=', '!=', '~'],
              values: async value =>
                getFilterValues('perm', value, this.props.agent.id),
            },
          ]
        : []),
      {
        type: 'q',
        label: 'mtime',
        description: datefileDescp,
        operators: ['=', '!=', '>', '<'],
        values: async value =>
          getFilterValues(
            'mtime',
            value,
            this.props.agent.id,
            {},
            formatUIDate,
          ),
      },
      {
        type: 'q',
        label: 'date',
        description: regdatefileDescp,
        operators: ['=', '!=', '>', '<'],
        values: async value =>
          getFilterValues('date', value, this.props.agent.id, {}, formatUIDate),
      },
      {
        type: 'q',
        label: 'uname',
        description: ownerfileDescp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('uname', value, this.props.agent.id),
      },
      {
        type: 'q',
        label: 'uid',
        description: owneridfileDescp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('uid', value, this.props.agent.id),
      },
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'gname',
              description: groupownerfileDescp,
              operators: ['=', '!=', '~'],
              values: async value =>
                getFilterValues('gname', value, this.props.agent.id),
            },
          ]
        : []),
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'gid',
              description: md5Descp,
              operators: ['=', '!=', '~'],
              values: async value =>
                getFilterValues('gid', value, this.props.agent.id),
            },
          ]
        : []),
      {
        type: 'q',
        label: 'md5',
        description: md5Descp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('md5', value, this.props.agent.id),
      },
      {
        type: 'q',
        label: 'sha1',
        description: sha1Descp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('sha1', value, this.props.agent.id),
      },
      {
        type: 'q',
        label: 'sha256',
        description: sha256Descp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('sha256', value, this.props.agent.id),
      },
      ...(((this.props.agent || {}).os || {}).platform !== 'windows'
        ? [
            {
              type: 'q',
              label: 'inode',
              description: inodeDescp,
              operators: ['=', '!=', '~'],
              values: async value =>
                getFilterValues('inode', value, this.props.agent.id),
            },
          ]
        : []),
      {
        type: 'q',
        label: 'size',
        description: sizeDescp,
        values: async value =>
          getFilterValues('size', value, this.props.agent.id),
      },
    ],
    registry: [
      {
        type: 'q',
        label: 'file',
        description: regkeyDescp,
        operators: ['=', '!=', '~'],
        values: async value =>
          getFilterValues('file', value, this.props.agent.id, {
            q: 'type=registry_key',
          }),
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
            placeholder={filePlace}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}
