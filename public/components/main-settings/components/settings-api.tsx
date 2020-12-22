/*
 * Wazuh app - React component building the API entries table.
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
  EuiProgress,
  EuiIcon
} from '@elastic/eui';
import ApiCheck from '../../../react-services/wz-api-check';
import { WzButtonPermissions } from '../../common/permissions/button';
import GenericRequest from '../../../react-services/generic-request';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import ErrorHandler from '../../../react-services/error-handler';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import AppState from '../../../react-services/app-state';
import { API_USER_STATUS_RUN_AS } from '../../../../server/lib/cache-api-user-has-run-as';


export class ApiTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false,
      isLoading: true,
    };
  }

  async componentDidMount() {
    store.dispatch(updateSelectedSettingsSection('api'));
    await this.getHosts();

  }

  async getHosts() {
    try {
      const apiEntriesResponse = await GenericRequest.request('GET', '/hosts/apis', {});
      const apiEntries = apiEntriesResponse.data;
      this.setState({ apiEntries, isLoading: false });
    }
    catch (error) {
      this.setState({ isLoading: false });
    }
  }

  showApiIsDown() {
    this.apiIsDown = true;
  }

  /**
  * @param {String} id
  * @param {Object} clusterInfo
  */
  async updateClusterInfoInRegistry(id, clusterInfo) {
    try {
      const url = `/hosts/update-hostname/${id}`;
      await GenericRequest.request('PUT', url, {
        cluster_info: clusterInfo
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Shows the add API component
   */
  showAddApi() {
    this.addingApi = true;
    this.addApiProps.enableClose = true;
  }

  showAddApiWithInitialError(error) {
    this.addApiProps.errorsAtInit = error;
    this.apiEntries = [];
    this.addingApi = true;
  }

  /**
   * Refresh the API entries
   */
  async refresh() {
    try {
      let status = 'complete';
      this.setState({ error: false });
      const hosts = await this.getHosts();
      this.setState({
        refreshingEntries: true,
        apiEntries: hosts
      });
      const entries = this.state.apiEntries;
      let numErr = 0;
      for (let idx in entries) {
        const entry = entries[idx];
        try {
          const data = await this.testApi(entry, true); // token refresh is forced
          const clusterInfo = data.data || {};
          const id = entries[idx].id;
          entries[idx].status = 'online';
          entries[idx].cluster_info = clusterInfo;
          //Updates the cluster info in the registry
          await this.updateClusterInfoInRegistry(id, clusterInfo);
        } catch (error) {
          numErr = numErr + 1;
          const code = ((error || {}).data || {}).code;
          const downReason = typeof error === 'string' ? error :
            (error || {}).message || ((error || {}).data || {}).message || 'Wazuh is not reachable';
          const status = code === 3099 ? 'down' : 'unknown';
          entries[idx].status = { status, downReason };
          if (entries[idx].id === this.props.currentDefault) { // if the selected API is down, we remove it so a new one will selected
            AppState.removeCurrentAPI();
          }
        }
      }
      if (numErr) {
        if (numErr >= entries.length) this.showApiIsDown();
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
        this.showAddApiWithInitialError(error);
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
        await this.checkManager(api);
        entries[idx].status = 'online';
      } catch (error) {
        const code = ((error || {}).data || {}).code;
        const downReason = typeof error === 'string' ? error :
          (error || {}).message || ((error || {}).data || {}).message || 'Wazuh is not reachable';
        const status = code === 3099 ? 'down' : 'unknown';
        entries[idx].status = { status, downReason };
      }
      this.setState({
        apiEntries: entries
      });
    } catch (error) {
      console.error('Error checking manager connection ', error);
    }
  }

  // Get current API index
  getCurrentAPIIndex() {
    if (this.apiEntries.length) {
      const idx = this.apiEntries
        .map(entry => entry.id)
        .indexOf(this.currentDefault);
      this.currentApiEntryIndex = idx;
    }
  }

  /**
   * Copy to the clickboard the string passed
   * @param {String} msg
   */
  copyToClipBoard(msg) {
    const el = document.createElement('textarea');
    el.value = msg;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    ErrorHandler.info('Error copied to the clipboard');
  }
  async checkManager(item, isIndex, silent = false) {
    try {
      // Get the index of the API in the entries
      const index = isIndex ? item : this.getApiIndex(item);

      // Get the Api information
      const api = this.apiEntries[index];
      const { username, url, port, id } = api;
      const tmpData = {
        username: username,
        url: url,
        port: port,
        cluster_info: {},
        insecure: 'true',
        id: id
      };

      // Test the connection
      const data = await ApiCheck.checkApi(tmpData, true);
      tmpData.cluster_info = data.data;
      const { cluster_info } = tmpData;
      // Updates the cluster-information in the registry
      await this.updateClusterInfoInRegistry(id, cluster_info);
      this.apiEntries[index].cluster_info = cluster_info;
      this.apiEntries[index].status = 'online';
      this.apiEntries[index].allow_run_as = data.data.allow_run_as;
      this.wzMisc.setApiIsDown(false);
      this.apiIsDown = false;
      !silent && ErrorHandler.info('Connection success', 'Settings');
      return;
    } catch (error) {
      this.load = false;
      if (!silent) {
        ErrorHandler.handle(error);
      }
      return Promise.reject(error);
    }
  }

  getApiIndex(api) {
    return this.apiEntries.map(entry => entry.id).indexOf(api.id);
  }
  // Set default API
  async setDefault(item) {
    try {
      await this.checkManager(item, false, true);
      const index = this.getApiIndex(item);
      const api = this.apiEntries[index];
      const { cluster_info, id } = api;
      const { manager, cluster, status } = cluster_info;

      // Check the connection before set as default
      AppState.setClusterInfo(cluster_info);
      const clusterEnabled = status === 'disabled';
      AppState.setCurrentAPI(
        JSON.stringify({
          name: clusterEnabled ? manager : cluster,
          id: id
        })
      );


      const currentApi = AppState.getCurrentAPI();
      this.currentDefault = JSON.parse(currentApi).id;
      this.apiTableProps.currentDefault = this.currentDefault;

      ErrorHandler.info(`API ${manager} set as default`);

      this.getCurrentAPIIndex();
      const extensions = await AppState.getExtensions(id);
      if (currentApi && !extensions) {
        const { id, extensions } = this.apiEntries[this.currentApiEntryIndex];
        AppState.setExtensions(id, extensions);
      }

      return this.currentDefault;
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  render() {
    if (this.state.isLoading) {
      return <EuiProgress size="xs" color="primary" />
    }
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
                    onClick={() => this.copyToClipBoard(item.downReason)}
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
                        onClick={() => this.copyToClipBoard(item.downReason)}
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
              content='The configurated API user uses the authentication context.'
            >
              <EuiIcon
                type='check'
              />
            </EuiToolTip>

          ) : value === API_USER_STATUS_RUN_AS.NOT_ALLOWED ? (
            <EuiToolTip
              position='top'
              content='The configurated API user is not allowed to use run_as. Give it permissions or set run_as with false value in host the configuration.'
            >
              <EuiIcon
                color='danger'
                type='alert'
              />
            </EuiToolTip>
          ) : '';
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
                tooltip={{ position: 'top', content: <p>Set as default</p> }}
                iconType={
                  item.id === this.props.currentDefault
                    ? 'starFilled'
                    : 'starEmpty'
                }
                aria-label="Set as default"
                onClick={async () => {
                  const currentDefault = await this.setDefault(item);
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
        <WzReduxProvider>
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
                  onClick={() => this.showAddApi()}
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
        </WzReduxProvider>
      </EuiPage>
    );
  }
}

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

