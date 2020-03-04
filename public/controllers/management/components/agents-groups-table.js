/*
 * Wazuh app - React component for building the groups table.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  EuiTitle,
  EuiButtonEmpty,
  EuiText,
  EuiToolTip
} from '@elastic/eui';

import { ExportConfiguration } from '../../agent/components/export-configuration';

export class AgentsInGroupTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      groupName: this.props.group.name || 'Group',
      agents: [],
      originalAgents: [],
      isLoading: false,
    };

    this.filters = { name: 'search', value: '' };
  }

  async componentDidMount() {
    try {
      const agents = await this.props.getAgentsByGroup(this.props.group.name);
      this.setState({
        agents: agents,
        originalAgents: agents
      });
    } catch (error) {
      console.error('error mounting the component ', error)
    }
  }

  onQueryChange = ({ query }) => {
    if (query) {
      this.setState({ isLoading: true });
      const filter = query.text || "";
      this.filters.value = filter;
      const items = filter
        ? this.state.originalAgents.filter(item => {
          return item.name.toLowerCase().includes(filter.toLowerCase());
        })
        : this.state.originalAgents;
      this.setState({
        isLoading: false,
        agents: items,
      });
    }
  };

  /**
   * Refresh the agents
   */
  async refresh() {
    try {
      this.setState({ refreshingAgents: true });
      const agents = await this.props.getAgentsByGroup(this.props.group.name);
      this.setState({
        originalAgents: agents,
        refreshingAgents: false
      });
    } catch (error) {
      this.setState({ refreshingAgents: false });
      console.error('error refreshing agents ', error)
    }
  }

  showConfirm(groupName) {
    this.setState({
      showConfirm: groupName
    });
  }

  render() {
    const columns = [
      {
        field: 'id',
        name: 'ID',
        sortable: true
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'ip',
        name: 'IP'
      },
      {
        field: 'status',
        name: 'Status',
        sortable: true
      },
      {
        field: 'os.name',
        name: 'OS name',
        sortable: true
      },
      {
        field: 'os.version',
        name: 'OS version',
        sortable: true
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true
      },
      {
        name: 'Actions',

        render: item => {
          return (
            <Fragment>
              <EuiFlexGroup>
                {this.state.showConfirm !== item.name &&
                  item.name !== 'default' && (
                    <Fragment>
                      <EuiFlexItem grow={false}>
                        <EuiToolTip
                          position="right"
                          content="Go to the agent"
                        >
                          <EuiButtonIcon
                            aria-label="View agent details"
                            onClick={() => this.props.goToAgent(item)}
                            iconType="eye"
                          />
                        </EuiToolTip>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiToolTip
                          position="right"
                          content="Delete agent"
                        >
                          <EuiButtonIcon
                            aria-label="Delete groups"
                            onClick={() => this.showConfirm(item.name)}
                            iconType="trash"
                            color="danger"
                          />
                        </EuiToolTip>
                      </EuiFlexItem>
                    </Fragment>
                  )}
                {this.state.showConfirm === item.name && (
                  <EuiFlexItem grow={true}>
                    <EuiText>
                      <p>
                        Are you sure you want to delete the {item.name} agent?
                        <EuiButtonEmpty onClick={() => this.showConfirm(false)}>
                          No
                        </EuiButtonEmpty>
                        <EuiButtonEmpty
                          onClick={async () => {
                            this.showConfirm(false);
                            await this.props.removeAgentFromGroup(item.id, this.state.groupName);
                            this.refresh();
                          }}
                          color="danger"
                        >
                          Yes
                        </EuiButtonEmpty>
                      </p>
                    </EuiText>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </Fragment>
          );
        }
      }
    ];

    const search = {
      onChange: this.onQueryChange,
      box: {
        incremental: this.state.incremental,
        schema: true
      }
    };

    return (
      <EuiPanel paddingSize="l" className='wz-margin-16'>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>{this.state.groupName}</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconSide="left"
              iconType="folderClosed"
              onClick={() => this.props.addAgents()}
            >
              Manage agents
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ExportConfiguration
              exportConfiguration={enabledComponents => this.props.exportConfigurationProps.exportConfiguration(enabledComponents)}
              type={this.props.exportConfigurationProps.type} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="importAction"
              onClick={async () => await this.props.export(this.state.groupName, [this.filters])}
            >
              Export formatted
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="refresh" onClick={() => this.refresh()}>
              Refresh
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
              From here you can list and manage your agents
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiInMemoryTable
          itemId="id"
          items={this.state.agents}
          columns={columns}
          search={search}
          pagination={true}
          loading={this.state.refreshingAgents || this.state.isLoading}
        />
      </EuiPanel>
    );
  }
}

AgentsInGroupTable.propTypes = {
  group: PropTypes.object,
  getAgentsByGroup: PropTypes.func,
  addAgents: PropTypes.func,
  export: PropTypes.func,
  removeAgentFromGroup: PropTypes.func,
  goToAgent: PropTypes.func,
  exportConfigurationProps: PropTypes.object
};
