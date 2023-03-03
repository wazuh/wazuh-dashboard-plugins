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
import {
  filtersToObject,
  IFilter,
  IWzSuggestItem,
} from '../../../wz-search-bar';
import { TableWzAPI } from '../../../../components/common/tables';
import { getFilterValues } from './lib';
import { formatUIDate } from '../../../../react-services/time-service';
import { i18n } from '@kbn/i18n';
const Descp1 = i18n.translate('wazuh.components.addModule.inventory.Descp1', {
  defaultMessage: 'Filter by package ID',
});
const Descp2 = i18n.translate('wazuh.components.addModule.inventory.Descp2', {
  defaultMessage: 'Filter by CVE ID',
});
const Descp3 = i18n.translate('wazuh.components.addModule.inventory.Descp3', {
  defaultMessage: 'Filter by CVE version',
});
const Descp4 = i18n.translate('wazuh.components.addModule.inventory.Descp4', {
  defaultMessage: 'Filter by architecture',
});
const Descp5 = i18n.translate('wazuh.components.addModule.inventory.Descp5', {
  defaultMessage: 'Filter by Severity',
});
const Descp6 = i18n.translate('wazuh.components.addModule.inventory.Descp6', {
  defaultMessage: 'Filter by CVSS2',
});
const Descp7 = i18n.translate('wazuh.components.addModule.inventory.Descp7', {
  defaultMessage: 'Filter by CVSS3',
});
const Descp8 = i18n.translate('wazuh.components.addModule.inventory.Descp8', {
  defaultMessage: 'Filter by Detection Time',
});
const label1 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label1',
  {
    defaultMessage: 'name',
  },
);
const label2 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label2',
  {
    defaultMessage: 'cve',
  },
);
const label3 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label3',
  {
    defaultMessage: 'version',
  },
);
const label4 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label4',
  {
    defaultMessage: 'architecture',
  },
);
const label5 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label5',
  {
    defaultMessage: 'severity',
  },
);
const label6 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label6',
  {
    defaultMessage: "'cvss2_score'",
  },
);
const label7 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label7',
  {
    defaultMessage: 'cvss3_score',
  },
);
const label8 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.label8',
  {
    defaultMessage: 'detection_time',
  },
);
const name1 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name1',
  {
    defaultMessage: 'Name',
  },
);
const name2 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name2',
  {
    defaultMessage: 'Version',
  },
);
const name3 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name3',
  {
    defaultMessage: 'Architecture',
  },
);
const name4 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name4',
  {
    defaultMessage: 'Severity',
  },
);
const name5 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name5',
  {
    defaultMessage: 'CVE',
  },
);
const name6 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name6',
  {
    defaultMessage: "'cvss2_score'",
  },
);
const name7 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name7',
  {
    defaultMessage: 'cvss3_score',
  },
);
const name8 = i18n.translate(
  'wazuh.components.agents.vuls.inventory.table.name8',
  {
    defaultMessage: 'detection_time',
  },
);
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
      label: label1,
      description: Descp1,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('name', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label2,
      description: Descp2,
      operators: ['=', '!=', '~'],
      values: async value => getFilterValues('cve', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label3,
      description: Descp3,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('version', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label4,
      description: Descp4,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('architecture', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label5,
      description: Descp5,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('severity', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label6,
      description: Descp6,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('cvss2_score', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label7,
      description: Descp7,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('cvss3_score', value, this.props.agent.id),
    },
    {
      type: 'q',
      label: label8,
      description: Descp8,
      operators: ['=', '!=', '~'],
      values: async value =>
        getFilterValues('detection_time', value, this.props.agent.id),
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
      this.setState({ isFlyoutVisible: true, currentItem: item }),
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
        name: name1,
        sortable: true,
        width: '100px',
      },
      {
        field: 'version',
        name: name2,
        sortable: true,
        truncateText: true,
        width: `${width}`,
      },
      {
        field: 'architecture',
        name: name3,
        sortable: true,
        width: '100px',
      },
      {
        field: 'severity',
        name: name4,
        sortable: true,
        width: `${width}`,
      },
      {
        field: 'cve',
        name: name5,
        sortable: true,
        truncateText: true,
        width: `${width}`,
      },
      {
        field: 'cvss2_score',
        name: name6,
        sortable: true,
        width: `${width}`,
      },
      {
        field: 'cvss3_score',
        name: name7,
        sortable: true,
        width: `${width}`,
      },
      {
        field: 'detection_time',
        name: name8,
        sortable: true,
        width: `100px`,
        render: formatUIDate,
      },
    ];
  }

  renderTable() {
    const getRowProps = item => {
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
      'external_references',
    ].join(',')}`;

    return (
      <TableWzAPI
        title='Vulnerabilities'
        tableColumns={columns}
        tableInitialSortingField='name'
        searchTable={true}
        searchBarSuggestions={this.suggestions}
        endpoint={`/vulnerability/${this.props.agent.id}?${selectFields}`}
        isExpandable={true}
        rowProps={getRowProps}
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
      <div className='wz-inventory'>
        {table}
        {this.state.isFlyoutVisible && (
          <FlyoutDetail
            vulName={this.state.currentItem.cve}
            agentId={this.props.agent.id}
            item={this.state.currentItem}
            closeFlyout={() => this.closeFlyout()}
            type='vulnerability'
            view='inventory'
            showViewInEvents={true}
            outsideClickCloses={true}
            {...this.props}
          />
        )}
      </div>
    );
  }
}
