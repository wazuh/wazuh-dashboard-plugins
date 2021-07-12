/*
 * Wazuh app - Agent vulnerabilities components
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
import { WzSearchBar, IFilter, IWzSuggestItem } from '../../../../components/wz-search-bar'
import { ICustomBadges } from '../../../wz-search-bar/components';
import {
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

export class FilterBar extends Component {
  
  suggestions: IWzSuggestItem[] = [
      {type: 'q', label: 'name', description:"Filter by package ID", operators:['=','!=', '~'], values: async (value) => getFilterValues('name', value, this.props.agent.id)},
      {type: 'q', label: 'cve', description:"Filter by CVE ID", operators:['=','!=', '~'], values: async (value) => getFilterValues('cve', value, this.props.agent.id)},
      {type: 'q', label: 'version', description:"Filter by CVE version", operators:['=','!=', '~'], values: async (value) => getFilterValues('version', value, this.props.agent.id)},
      {type: 'q', label: 'architecture', description:"Filter by architecture", operators:['=','!=', '~'], values: async (value) => getFilterValues('architecture', value, this.props.agent.id)},
    ]

  props!:{
    onFiltersChange(filters:IFilter[]): void
    agent: {id: string, agentPlatform: string}
    onChangeCustomBadges?(customBadges: ICustomBadges[]): void 
    customBadges?: ICustomBadges[]
    filters: IFilter[]
  }

  render() {
    const { onFiltersChange, filters} = this.props;
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzSearchBar
            noDeleteFiltersOnUpdateSuggests
            filters={filters}
            onFiltersChange={onFiltersChange}
            suggestions={this.suggestions}
            placeholder='Filter or search vulnerabilities' />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
}