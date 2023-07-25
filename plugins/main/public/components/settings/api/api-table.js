/*
 * Wazuh app - React component building the API entries table.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiToolTip,
  EuiHealth,
  EuiPanel,
  EuiPage,
  EuiButtonEmpty,
  EuiTitle,
  EuiText,
  EuiLoadingSpinner,
  EuiIcon
} from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import { AppState } from '../../../react-services/app-state';
import { API_USER_STATUS_RUN_AS } from '../../../../server/lib/cache-api-user-has-run-as';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { compose } from 'redux'
import {
  UI_ERROR_SEVERITIES,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const ApiTable = compose(withErrorBoundary, withReduxProvider)(class ApiTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false
    };
  }

  componentDidMount() {
    store.dispatch(updateSelectedSettingsSection('api'));
    this.setState({
      apiEntries: this.props.apiEntries
    });
  }

  /**
   * Refresh the API entries
   */
  async refresh() {
    try {
      let status = 'complete';
      this.setState({ error: false });
      const hosts = await this.props.getHosts();
      this.setState({
        refreshingEntries: true,
        apiEntries: hosts
      });
      const entries = this.state.apiEntries;
      let numErr = 0;
      for (let idx in entries) {
        const entry = entries[idx];
        try {
          const data = await this.props.testApi(entry, true); // token refresh is forced
          const clusterInfo = data.data || {};
          const id = entries[idx].id;
          entries[idx].status = 'online';
          entries[idx].cluster_info = clusterInfo;
          //Updates the cluster info in the registry
          await this.props.updateClusterInfoInRegistry(id, clusterInfo);
        } catch (error) {
          numErr = numErr + 1;
          const code = ((error || {}).data || {}).code;
          const downReason = typeof error === 'string' ? error :
            (error || {}).message || ((error || {}).data || {}).message || 'Wazuh is not reachable';
          const status = code === 3099 ? 'down' : 'unknown';
          entries[idx].status = { status, downReason };
          if(entries[idx].id === this.props.currentDefault){ // if the selected API is down, we remove it so a new one will selected
            AppState.removeCurrentAPI();
          }
        }
      }
      if (numErr) {
        if (numErr >= entries.length) this.props.showApiIsDown();
      }
      this.setState({
        apiEntries: entries,
        status: status,
        refreshingEntries: false
      });
    } catch (error) {
      if (
        error &&
        error.data &&
        error.data.message &&
        error.data.code === 2001
      ) {
        this.props.showAddApiWithInitialError(error);
      }
    }
  }

  /**
   * Checks the API connectivity
   * @param {Object} api
   */
  async checkApi(api) {
    try {
      const entries = this.state.apiEntries;
      const idx = entries.map(e => e.id).indexOf(api.id);
      try {
        await this.props.checkManager(api);
        entries[idx].status = 'online';
      } catch (error) {
        const code = ((error || {}).data || {}).code;
        const downReason =
          typeof error === 'string'
            ? error
            : (error || {}).message ||
              ((error || {}).data || {}).message ||
              'Wazuh is not reachable';
        const status = code === 3099 ? 'down' : 'unknown';
        entries[idx].status = { status, downReason };
        throw error;
      } finally {
        this.setState({
          apiEntries: entries,
        });
      }
    } catch (error) {
      const options = {
        context: `${ApiTable.name}.checkApi`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error checking manager connection: ${error.message || error}`,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  render() {
    const items = [...this.state.apiEntries];
    const columns = [
      {
        field: 'id',
        name: 'ID',
        align: 'left',
        sortable: true
      },
      {
        field: 'cluster_info.cluster',
        name: 'Cluster',
        align: 'left',
        sortable: true
      },
      {
        field: 'cluster_info.manager',
        name: 'Manager',
        align: 'left',
        sortable: true
      },
      {
        field: 'url',
        name: 'Host',
        align: 'left',
        sortable: true
      },
      {
        field: 'port',
        name: 'Port',
        align: 'left',
        sortable: true
      },
      {
        field: 'username',
        name: 'Username',
        align: 'left',
        sortable: true
      },
      {
        field: 'status',
        name: 'Status',
        align: 'left',
        sortable: true,
        render: item => {
          if (item) {
            return item === 'online' ? (
              <EuiHealth color="success">Online</EuiHealth>
            ) : item.status === 'down' ? (
              <span>
                <EuiHealth color="warning">Warning</EuiHealth>
                <EuiToolTip position="top" content={item.downReason}>
                  <EuiButtonIcon
                    color="primary"
                    style={{ marginTop: '-12px' }}
                    iconType="questionInCircle"
                    aria-label="Info about the error"
                    onClick={() => this.props.copyToClipBoard(item.downReason)}
                  />
                </EuiToolTip>
              </span>
            ) : (
              <span>
                <EuiHealth color="danger">Offline</EuiHealth>
                <EuiToolTip position="top" content={item.downReason}>
                  <EuiButtonIcon
                    color="primary"
                    style={{ marginTop: '-12px' }}
                    iconType="questionInCircle"
                    aria-label="Info about the error"
                    onClick={() => this.props.copyToClipBoard(item.downReason)}
                  />
                </EuiToolTip>
              </span>
            );
          } else {
            return (
              <span>
                <EuiLoadingSpinner size="s" />
                <span>&nbsp;&nbsp;Checking</span>
              </span>
            );
          }
        }
      },
      {
        name: 'Run as',
        field: 'allow_run_as',
        align: 'center',
        sortable: true,
        width: '80px',
        render: (value) => {
          return value === API_USER_STATUS_RUN_AS.ENABLED ? (
            <EuiToolTip
              position='top'
              content='The configured API user uses the authentication context.'
            >
              <EuiIcon
                type='check'
              />
            </EuiToolTip>

          ) : value === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED ? (
            <EuiToolTip
              position='top'
              content='The configured API user is not allowed to use run_as. Give it permissions or set run_as with false value in the host configuration.'
            >
              <EuiIcon
                color='danger'
                type='alert'
              />
            </EuiToolTip>
          ): '';
        }
      },
      {
        name: 'Actions',
        render: item => (
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <WzButtonPermissions
                buttonType='icon'
                roles={[]}
                tooltip={{position: 'top', content: <p>Set as default</p>}}
                iconType={
                  item.id === this.props.currentDefault
                    ? 'starFilled'
                    : 'starEmpty'
                }
                aria-label="Set as default"
                onClick={async () => {
                  const currentDefault = await this.props.setDefault(item);
                  this.setState({
                    currentDefault
                  });
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="top" content={<p>Check connection</p>}>
                <EuiButtonIcon
                  aria-label="Check connection"
                  iconType="refresh"
                  onClick={async () => await this.checkApi(item)}
                  color="success"
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      }
    ];

    const search = {
      box: {
        incremental: this.state.incremental,
        schema: true
      }
    };

    return (
      <EuiPage>
          <EuiPanel paddingSize="l">
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle>
                      <h2>Wazuh API configuration</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <WzButtonPermissions
                  buttonType='empty'
                  iconType="plusInCircle"
                  roles={[]}
                  onClick={() => this.props.showAddApi()}
                >
                  Add new
                </WzButtonPermissions>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="refresh"
                  onClick={async () => await this.refresh()}
                >
                  Refresh
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                  From here you can manage and configure the API entries. You can
                  also check their connection and status.
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiInMemoryTable
              itemId="id"
              items={items}
              search={search}
              columns={columns}
              pagination={true}
              sorting={true}
              loading={this.state.refreshingEntries}
            />
          </EuiPanel>
      </EuiPage>
    );
  }
});

ApiTable.propTypes = {
  apiEntries: PropTypes.array,
  currentDefault: PropTypes.string,
  setDefault: PropTypes.func,
  checkManager: PropTypes.func,
  updateClusterInfoInRegistry: PropTypes.func,
  getHosts: PropTypes.func,
  testApi: PropTypes.func,
  showAddApiWithInitialError: PropTypes.func,
  showApiIsDown: PropTypes.func,
  copyToClipBoard: PropTypes.func
};
