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
  EuiSpacer,
  EuiProgress,
  EuiIcon
} from '@elastic/eui';
import { AddApi } from '../../../components/settings/api/add-api'
import { WzButtonPermissions } from '../../common/permissions/button';
import GenericRequest from '../../../react-services/generic-request';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import ErrorHandler from '../../../react-services/error-handler';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import ApiCheck from '../../../react-services/wz-api-check';
import AppState from '../../../react-services/app-state';
import { API_USER_STATUS_RUN_AS } from '../../../../server/lib/cache-api-user-has-run-as';
import { WzMisc } from '../../../factories/misc';


const wzMisc = new WzMisc();
export class ApiTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false,
      isLoading: true,
      showAddNewApi: false,
      errorsAtInit: false,
      addingApi: false,
      apiIsDown: false

      // currentDefault,
    };
  }

  async componentDidMount() {
    store.dispatch(updateSelectedSettingsSection('api'));
    await this.refresh();

  }

  async getHosts() {
    try {
      const apiEntriesResponse = await GenericRequest.request('GET', '/hosts/apis', {});
      const apiEntries = apiEntriesResponse.data;
      this.setState({ apiEntries, isLoading: false });
      return apiEntries
    }
    catch (error) {
      this.setState({ isLoading: false });
    }
  }

  showApiIsDown() {
    this.setState({ apiIsDown: true })
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
    this.setState({
      showAddNewApi: true
    })
  }

  showAddApiWithInitialError(error) {
    this.setState({
      errorsAtInit: error,
      addingApi: true,
      apiEntries: []
    })
  }

  async testApi(entry, force) {
    return await ApiCheck.checkApi(entry, force)
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
      }, async () => {
        const entries = this.state.apiEntries;
        let numErr = 0;
        for (let idx in entries) {
          const entry = entries[idx];
          try {
            const { id: id2 } = entry;
            const tmpData = {
              id: id2
            };
            const data = await this.testApi(tmpData, true); // token refresh is forced
            const clusterInfo = data.data || {};
            const id = entries[idx].id;
            entries[idx].status = 'online';
            entries[idx].cluster_info = clusterInfo;
            const { allow_run_as, ...clusterInfoDataRegistry } = clusterInfo;
            //Updates the cluster info in the registry
            await this.updateClusterInfoInRegistry(id, clusterInfoDataRegistry);
          } catch (error) {
            numErr = numErr + 1;
            const code = ((error || {}).data || {}).code;
            const downReason = typeof error === 'string' ? error :
              (error || {}).message || ((error || {}).data || {}).message || 'Wazuh is not reachable';
            const status = code === 3099 ? 'down' : 'unknown';
            entries[idx].status = { status, downReason };
            if (entries[idx].id === this.currentDefault) {
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
    if (this.state.apiEntries.length) {
      const idx = this.state.apiEntries
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
      const api = this.state.apiEntries[index];
      const { id } = api;
      const tmpData = {
        id: id
      };
      // Test the connection
      const data = await ApiCheck.checkApi(tmpData, true);
      tmpData.cluster_info = data.data;
      const { cluster_info } = tmpData;
      // Updates the cluster-information in the registry
      await this.updateClusterInfoInRegistry(id, cluster_info);
      const entries = this.state.apiEntries;
      entries[index].cluster_info = cluster_info;
      entries[index].status = 'online';
      entries[index].allow_run_as = data.data.allow_run_as;
      this.setState({
        apiEntries: entries
      })
      wzMisc.setApiIsDown(false);
      this.setState({ apiIsDown: false })
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
    return this.state.apiEntries.map(entry => entry.id).indexOf(api.id);
  }
  // Set default API
  async setDefault(item) {
    try {
      await this.checkManager(item, false, true);
      const index = this.getApiIndex(item);
      const api = this.state.apiEntries[index];
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

      ErrorHandler.info(`API ${manager} set as default`);

      this.getCurrentAPIIndex();
      const extensions = await AppState.getExtensions(id);
      if (currentApi && !extensions) {
        const { id, extensions } = this.state.apiEntries[this.currentApiEntryIndex];
        AppState.setExtensions(id, extensions);
      }

      return this.currentDefault;
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  closeAddApi() {
    this.setState({
      showAddNewApi: false
    })
  }

  async checkApisStatus() {
    try {
      let numError = 0;
      for (let idx in this.state.apiEntries) {
        try {
          await this.checkManager(this.state.apiEntries[idx], false, true);
          const entries = this.state.apiEntries;
          entries[idx].status = 'online';
          this.setState({ apiEntries: entries });
        } catch (error) {
          const code = ((error || {}).data || {}).code;
          const downReason = typeof error === 'string' ? error :
            (error || {}).message || ((error || {}).data || {}).message || 'Wazuh is not reachable';
          const status = code === 3099 ? 'down' : 'unknown';
          const entries = this.state.apiEntries;
          entries.status = { status, downReason };
          this.setState({ apiEntries: entries });
          numError = numError + 1;
          if (this.state.apiEntries[idx].id === this.currentDefault) { // if the selected API is down, we remove it so a new one will selected
            AppState.removeCurrentAPI();
          }
        }
      }
      return numError;
    } catch (error) { }
  }

  async checkForNewApis() {
    try {
      this.setState({
        errorsAtInit: false,
        addingApi: true
      })
      const hosts = await this.getHosts();
      //Tries to check if there are new APIs entries in the wazuh.yml also, checks if some of them have connection
      if (!hosts.length)
        throw {
          message: 'There were not found any API entry in the wazuh.yml',
          type: 'warning',
          closedEnabled: false
        };
      const notRecheable = await this.checkApisStatus();
      if (notRecheable) {
        if (notRecheable >= hosts.length) {
          this.setState({ apiIsDown: true })
          throw {
            message:
              'Wazuh API not recheable, please review your configuration',
            type: 'danger',
            closedEnabled: true
          };
        }
        throw {
          message: `Some of the API entries are not reachable. You can still use the Wazuh APP but please, review your hosts configuration.`,
          type: 'warning',
          closedEnabled: true
        };
      }
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  render() {
    if (this.state.showAddNewApi) {

      return <span>
        <EuiSpacer></EuiSpacer>
        <AddApi enableClose={true} closeAddApi={() => this.closeAddApi()} checkForNewApis={() => this.checkForNewApis()}></AddApi>
      </span>
    }
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
                  item.id === this.currentDefault
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
