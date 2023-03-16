/*
 * Wazuh app - Agent vulnerabilities table component
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
import { Direction } from '@elastic/eui';
import { FlyoutDetail } from './flyout';
import { filtersToObject, IFilter, IWzSuggestItem } from '../../../wz-search-bar';
import { TableWzAPI } from '../../../../components/common/tables';
import { getFilterValues } from './lib';
import { formatUIDate } from '../../../../react-services/time-service';

export class InventoryTable extends Component {
  state: {
    error?: string;
    pageIndex: number;
    pageSize: number;
    sortField: string;
    isFlyoutVisible: Boolean;
    sortDirection: Direction;
    isLoading: boolean;
    currentItem: {};
  };

  suggestions: IWzSuggestItem[] = [
    {
      type: 'q',
      label: 'name',
      description: 'Filter by package ID',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('name', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'cve',
      description: 'Filter by CVE ID',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('cve', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'version',
      description: 'Filter by CVE version',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('version', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'architecture',
      description: 'Filter by architecture',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('architecture', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'severity',
      description: 'Filter by Severity',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('severity', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'cvss2_score',
      description: 'Filter by CVSS2',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('cvss2_score', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'cvss3_score',
      description: 'Filter by CVSS3',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('cvss3_score', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: 'detection_time',
      description: 'Filter by Detection Time',
      operators: ['=', '!=', '~'],
      values: async (value) => getFilterValues('detection_time', value, this.props.agent.id),
    },
  ];

  props!: {
    filters: IFilter[];
    agent: any;
    items: [];
    onFiltersChange: Function;
  };

  constructor(props) {
    super(props);

    this.state = {
      pageIndex: 0,
      pageSize: 15,
      sortField: 'name',
      sortDirection: 'asc',
      isLoading: false,
      isFlyoutVisible: false,
      currentItem: {},
    };
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentItem: {} });
  }

  async showFlyout(item, redirect = false) {
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () =>
      this.setState({ isFlyoutVisible: true, currentItem: item })
    );
  }

  async componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (JSON.stringify(filters) !== JSON.stringify(prevProps.filters)) {
      this.setState({ pageIndex: 0, isLoading: true });
    }
  }

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;
    const direction = sortDirection === 'asc' ? '+' : '-';

    return direction + sortField;
  }

  buildFilter() {
    const { pageIndex, pageSize } = this.state;
    const filters = filtersToObject(this.props.filters);
    const filter = {
      ...filters,
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter(),
    };
    return filter;
  }

  columns() {
    let width;
    (((this.props.agent || {}).os || {}).platform || false) === 'windows'
      ? (width = '60px')
      : (width = '80px');
    return [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        width: '100px',
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true,
        truncateText: true,
        width: `${width}`,
      },
      {
        field: 'architecture',
        name: 'Architecture',
        sortable: true,
        width: '100px',
      },
      {
        field: 'severity',
        name: 'Severity',
        sortable: true,
        width: `${width}`,
      },
      {
        field: 'cve',
        name: 'CVE',
        sortable: true,
        truncateText: true,
        width: `${width}`,
      },
      {
        field: 'cvss2_score',
        name: 'CVSS2 Score',
        sortable: true,
        width: `${width}`,
      },
      {
        field: 'cvss3_score',
        name: 'CVSS3 Score',
        sortable: true,
        width: `${width}`,
      },
      {
        field: 'detection_time',
        name: 'Detection Time',
        sortable: true,
        width: `100px`,
        render: formatUIDate,
      },
    ];
  }

  renderTable() {
    const getRowProps = (item) => {
      const id = `${item.name}-${item.cve}-${item.architecture}-${item.version}-${item.severity}-${item.cvss2_score}-${item.cvss3_score}-${item.detection_time}`;
      return {
        'data-test-subj': `row-${id}`,
        onClick: () => this.showFlyout(item),
      };
    };

    const { error } = this.state;
    const { filters, onFiltersChange } = this.props;
    const columns = this.columns();
    const selectFields = `select=${[
      'cve',
      'architecture',
      'version',
      'name',
      'severity',
      'cvss2_score',
      'cvss3_score',
      'detection_time',
      'title',
      'condition',
      'updated',
      'published',
      'external_references'
    ].join(',')}`;

    return (
      <TableWzAPI
        title="Vulnerabilities"
        tableColumns={columns}
        tableInitialSortingField="name"
        searchTable={true}
        searchBarSuggestions={this.suggestions}
        endpoint={`/vulnerability/${this.props.agent.id}?${selectFields}`}
        isExpandable={true}
        rowProps={getRowProps}
        mapResponseItem={(item) => ({
          ...item,
          // Some vulnerability data could not contain the external_references field.
          // This causes the rendering of them can crash when opening the flyout with the details.
          // So, we ensure the fields are defined with the expected data structure.
          external_references: Array.isArray(item?.external_references) 
            ? item?.external_references
            : []
        })}
        error={error}
        downloadCsv={true}
        filters={filters}
        onFiltersChange={onFiltersChange}
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
    );
  }

  render() {
    const table = this.renderTable();
    return (
      <div className="wz-inventory">
        {table}
        {this.state.isFlyoutVisible && (
          <FlyoutDetail
            vulName={this.state.currentItem.cve}
            agentId={this.props.agent.id}
            item={this.state.currentItem}
            closeFlyout={() => this.closeFlyout()}
            type="vulnerability"
            view="inventory"
            showViewInEvents={true}
            outsideClickCloses={true}
            {...this.props}
          />
        )}
      </div>
    );
  }
}
