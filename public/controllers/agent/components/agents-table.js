/*
 * Wazuh app - React component for building the agents table.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */


import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiIcon,
  EuiTitle,
  EuiButtonEmpty,
  EuiSearchBar,
  EuiText,
  EuiPopover,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
  EuiButton,
  EuiCallOut,
} from '@elastic/eui';


class WzInMemoryTable extends EuiInMemoryTable {
  constructor(props) {
    super(props);
  }

  renderSearchBar() {
    const { search } = this.props;
    const isBoolean = item => {return typeof item == 'boolean'};
    if (search) {
      const {
        onChange, // eslint-disable-line no-unused-vars
        ...searchBarProps
      } = isBoolean(search) ? {} : search;
      if (searchBarProps.box && searchBarProps.box.schema === true) {
        searchBarProps.box.schema = this.resolveSearchSchema();
      }

      return <EuiSearchBar onChange={this.onQueryChange} {...searchBarProps} />;
    }
  }
}


export class AgentsTable extends Component {

  constructor(props) {
    super(props);
  }
  
  columns() {
    return [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
      },
      {
        field: 'ip',
        name: 'IP',
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        sortable: true,
      },
      {
        field: 'group',
        name: 'Group',
        sortable: true,
      },
      {
        field: 'os_name',
        name: 'OS name',
        sortable: true,
      },
      {
        field: 'os_version',
        name: 'OS version',
        sortable: true,
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true,
      },
      {
        field: 'dateAdd',
        name: 'Registration date',
        sortable: true,
      },
      {
        field: 'lastKeepAlive',
        name: 'Last keep alive',
        sortable: true,
      },
      {
        field: 'actions',
        name: 'Actions',
        render: this.actions
      },
    ];
  }

  actions(item) {
    const style = {
      marginRight: 5
    }

    return (
      <div>
        
        <EuiIcon type="discoverApp" style={style} />
        <EuiIcon type="wrench" />
      </div>
    );
  };

  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={() => this.refresh()}>
          Formatted          
        </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  render() {
    const search = {
      box: {
        incremental: true,
        schema: true,
      }
    };

    const groupStyle = {
      margin: 15
    } 


    return (
      
      <EuiPanel paddingSize="l">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Agents</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <this.formattedButton />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="plusInCircle" onClick={() => this.refresh()}>
              Add new agent
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={groupStyle}>
          <EuiFlexItem>
            <WzInMemoryTable
              itemId="id"
              items={this.props.agents}
              columns={this.columns()}
              search={search}
              pagination={true}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

AgentsTable.propTypes = {
  agents: PropTypes.array
};