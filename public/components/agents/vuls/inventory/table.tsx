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
import { FlyoutDetail } from './flyout';
import { TableWzAPI } from '../../../../components/common/tables';
import { getFilterValues } from './lib';
import { formatUIDate } from '../../../../react-services/time-service';
import { EuiIconTip } from '@elastic/eui';

const searchBarWQLOptions = {
  searchTermFields: [
    'name',
    'cve',
    'version',
    'architecture',
    'severity',
    'cvss2_score',
    'cvss3_score'
  ]
};

export class InventoryTable extends Component {
  state: {
    error?: string;
    isFlyoutVisible: Boolean;
    isLoading: boolean;
    currentItem: {};
  };


  props!: {
    filters: string;
    agent: any;
    items: [];
    onFiltersChange: Function;
  };

  constructor(props) {
    super(props);

    this.state = {
      isFlyoutVisible: false,
      currentItem: {}
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
        name: (
          <span>Detection Time{' '}
            <EuiIconTip
              content='This is not searchable through a search term.'
              size='s'
              color='subdued'
              type='alert'
            />
          </span>
        ),
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

    const agentID = this.props.agent.id;

    return (
      <TableWzAPI
        title="Vulnerabilities"
        tableColumns={columns}
        tableInitialSortingField="name"
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
        searchTable
        downloadCsv
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
        filters={this.props.filters}
        searchBarProps={{
          modes: [
            {
              id: 'wql',
              options: searchBarWQLOptions,
              suggestions: {
                field(currentValue) {
                  return [
                    { label: 'architecture', description: 'filter by architecture' },
                    { label: 'cve', description: 'filter by CVE ID' },
                    { label: 'cvss2_score', description: 'filter by CVSS2' },
                    { label: 'cvss3_score', description: 'filter by CVSS3' },
                    { label: 'detection_time', description: 'filter by detection time' },
                    { label: 'name', description: 'filter by package name' },
                    { label: 'severity', description: 'filter by severity' },
                    { label: 'version', description: 'filter by CVE version' },
                  ];
                },
                value: async (currentValue, { field }) => {
                  try{
                    return await getFilterValues(field, currentValue, agentID, {}, label => ({label}));
                  }catch(error){
                    return [];
                  };
                },
              },
            }
          ]
        }}
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
