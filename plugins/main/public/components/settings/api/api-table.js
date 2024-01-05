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
  EuiIcon,
} from '@elastic/eui';
import { WzButtonPermissions } from '../../common/permissions/button';
import { AppState } from '../../../react-services/app-state';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import {
  getWazuhCheckUpdatesPlugin,
  getWazuhCorePlugin,
} from '../../../kibana-services';
import { AvailableUpdatesFlyout } from './available-updates-flyout';
import { formatUIDate } from '../../../react-services/time-service';

export const ApiTable = compose(
  withErrorBoundary,
  withReduxProvider,
)(
  class ApiTable extends Component {
    constructor(props) {
      super(props);

      const { getAvailableUpdates } = getWazuhCheckUpdatesPlugin();

      this.state = {
        apiEntries: [],
        refreshingEntries: false,
        availableUpdates: {},
        getAvailableUpdates,
        refreshingAvailableUpdates: true,
        apiAvailableUpdateDetails: undefined,
      };
    }

    async getApisAvailableUpdates(forceUpdate = false) {
      try {
        this.setState({ refreshingAvailableUpdates: true });
        const availableUpdates = await this.state.getAvailableUpdates(
          forceUpdate,
        );
        this.setState({ availableUpdates });
      } catch (error) {
        const options = {
          context: `${ApiTable.name}.checkAvailableUpdates`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Error checking available updates: ${error.message || error
              }`,
          },
        };

        getErrorOrchestrator().handleError(options);
      } finally {
        this.setState({ refreshingAvailableUpdates: false });
      }
    }

    componentDidMount() {
      this.setState({
        apiEntries: this.props.apiEntries,
      });

      this.getApisAvailableUpdates();
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
          apiEntries: hosts,
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
            const downReason =
              typeof error === 'string'
                ? error
                : (error || {}).message ||
                ((error || {}).data || {}).message ||
                'Wazuh is not reachable';
            const status = code === 3099 ? 'down' : 'unknown';
            entries[idx].status = { status, downReason };
            if (entries[idx].id === this.props.currentDefault) {
              // if the selected API is down, we remove it so a new one will selected
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
          refreshingEntries: false,
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
            title: `Error checking manager connection: ${error.message || error
              }`,
          },
        };

        getErrorOrchestrator().handleError(options);
      }
    }

    render() {
      const { DismissNotificationCheck } = getWazuhCheckUpdatesPlugin();

      const API_UPDATES_STATUS_COLUMN = {
        upToDate: {
          text: 'Up to date',
          color: 'success',
        },
        availableUpdates: {
          text: 'Available updates',
          color: 'warning',
        },
        disabled: {
          text: 'Checking updates disabled',
          color: 'subdued',
        },
        error: {
          text: 'Error checking updates',
          color: 'danger',
        },
      };

      const isLoading =
        this.state.refreshingEntries || this.state.refreshingAvailableUpdates;

      const items = [
        ...this.state.apiEntries?.map(apiEntry => {
          const versionData =
            this.state.availableUpdates?.apis_available_updates?.find(
              apiAvailableUpdates => apiAvailableUpdates.api_id === apiEntry.id,
            ) || {};

          return {
            ...versionData,
            ...apiEntry,
            version_status: versionData.status,
          };
        }),
      ];

      const columns = [
        {
          field: 'id',
          name: 'ID',
          align: 'left',
          sortable: true,
        },
        {
          field: 'cluster_info.cluster',
          name: 'Cluster',
          align: 'left',
          sortable: true,
        },
        {
          field: 'cluster_info.manager',
          name: 'Manager',
          align: 'left',
          sortable: true,
        },
        {
          field: 'url',
          name: 'Host',
          align: 'left',
          sortable: true,
        },
        {
          field: 'port',
          name: 'Port',
          align: 'left',
          sortable: true,
        },
        {
          field: 'username',
          name: 'Username',
          align: 'left',
          sortable: true,
        },
        {
          field: 'status',
          name: 'Status',
          align: 'left',
          sortable: true,
          render: item => {
            if (item) {
              return item === 'online' ? (
                <EuiHealth color='success' style={{ wordBreak: 'normal' }}>
                  Online
                </EuiHealth>
              ) : item.status === 'down' ? (
                <EuiFlexGroup
                  alignItems='center'
                  gutterSize='xs'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiHealth color='warning' style={{ wordBreak: 'normal' }}>
                      Warning
                    </EuiHealth>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiToolTip position='top' content={item.downReason}>
                      <EuiButtonIcon
                        color='primary'
                        iconType='questionInCircle'
                        aria-label='Info about the error'
                        onClick={() =>
                          this.props.copyToClipBoard(item.downReason)
                        }
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                </EuiFlexGroup>
              ) : (
                <EuiFlexGroup
                  alignItems='center'
                  gutterSize='xs'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiHealth color='danger' style={{ wordBreak: 'normal' }}>
                      Offline
                    </EuiHealth>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiToolTip position='top' content={item.downReason}>
                      <EuiButtonIcon
                        color='primary'
                        iconType='questionInCircle'
                        aria-label='Info about the error'
                        onClick={() =>
                          this.props.copyToClipBoard(item.downReason)
                        }
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                </EuiFlexGroup>
              );
            } else {
              return (
                <span>
                  <EuiLoadingSpinner size='s' />
                  <span>&nbsp;&nbsp;Checking</span>
                </span>
              );
            }
          },
        },
        {
          field: 'current_version',
          name: 'Version',
          align: 'left',
          sortable: true,
        },
        {
          field: 'version_status',
          name: 'Updates status',
          sortable: true,
          render: (item, api) => {
            const color = API_UPDATES_STATUS_COLUMN[item]?.color ?? 'subdued';

            const content =
              API_UPDATES_STATUS_COLUMN[item]?.text ?? 'Never checked';

            if (!this.state.refreshingAvailableUpdates) {
              return (
                <EuiFlexGroup
                  alignItems='center'
                  gutterSize='xs'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiHealth color={color} style={{ wordBreak: 'normal' }}>
                      {content}

                    </EuiHealth>
                  </EuiFlexItem>
                  {!item ? (
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position='top'
                        content={
                          <p>
                            Click <b>Check updates</b> button to get information
                          </p>
                        }
                      >
                        <EuiButtonIcon
                          aria-label={content}
                          iconType='questionInCircle'
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  ) : null}
                  {item === 'availableUpdates' ? (
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position='top'
                        content={<p>View available updates</p>}
                      >
                        <EuiButtonIcon
                          aria-label='Availabe updates'
                          iconType='eye'
                          onClick={() =>
                            this.setState({ apiAvailableUpdateDetails: api })
                          }
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  ) : null}
                  {item === 'error' && api.error?.detail ? (
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position='top'
                        title={api.error.title}
                        content={api.error.detail}
                      >
                        <EuiButtonIcon
                          color='primary'
                          iconType='questionInCircle'
                          aria-label='Info about the error'
                          onClick={() =>
                            this.props.copyToClipBoard(api.error.detail)
                          }
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  ) : null}
                </EuiFlexGroup>
              );
            } else {
              return (
                <span>
                  <EuiLoadingSpinner size='s' />
                  <span>&nbsp;&nbsp;Checking</span>
                </span>
              );
            }
          },
        },
        {
          name: 'Run as',
          field: 'allow_run_as',
          align: 'center',
          sortable: true,
          width: '80px',
          render: value => {
            return value ===
              getWazuhCorePlugin().API_USER_STATUS_RUN_AS.ENABLED ? (
              <EuiToolTip
                position='top'
                content='The configured API user uses the authentication context.'
              >
                <EuiIcon type='check' />
              </EuiToolTip>
            ) : value ===
              getWazuhCorePlugin().API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED ? (
              <EuiToolTip
                position='top'
                content='The configured API user is not allowed to use run_as. Give it permissions or set run_as with false value in the host configuration.'
              >
                <EuiIcon color='danger' type='alert' />
              </EuiToolTip>
            ) : (
              ''
            );
          },
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
                  aria-label='Set as default'
                  onClick={async () => {
                    const currentDefault = await this.props.setDefault(item);
                    this.setState({
                      currentDefault,
                    });
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip position='top' content={<p>Check connection</p>}>
                  <EuiButtonIcon
                    aria-label='Check connection'
                    iconType='refresh'
                    onClick={async () => await this.checkApi(item)}
                    color='success'
                  />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
        },
      ];

      const search = {
        box: {
          incremental: this.state.incremental,
          schema: true,
        },
      };

      return (
        <EuiPage>
          <EuiPanel paddingSize='l'>
            <EuiFlexGroup alignItems='center'>
              <EuiFlexItem>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle>
                      <h2>API Configuration</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <WzButtonPermissions
                  buttonType='empty'
                  iconType='plusInCircle'
                  roles={[]}
                  onClick={() => this.props.showAddApi()}
                >
                  Add new
                </WzButtonPermissions>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType='refresh'
                  onClick={async () => await this.refresh()}
                >
                  Refresh
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType='refresh'
                  onClick={async () => await this.getApisAvailableUpdates(true)}
                >
                  <span>
                    Check updates{' '}
                    <EuiToolTip
                      title='Last check'
                      content={
                        this.state.availableUpdates?.last_check_date
                          ? formatUIDate(
                            new Date(
                              this.state.availableUpdates.last_check_date,
                            ),
                          )
                          : '-'
                      }
                    >
                      <EuiIcon type='iInCircle' color='primary' />
                    </EuiToolTip>
                  </span>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <DismissNotificationCheck />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiText color='subdued' style={{ paddingBottom: '15px' }}>
                  From here you can manage and configure the API entries. You
                  can also check their connection and status.
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiInMemoryTable
              itemId='id'
              items={items}
              search={search}
              columns={columns}
              pagination={true}
              sorting={true}
              loading={isLoading}
              tableLayout='auto'
            />
          </EuiPanel>
          <AvailableUpdatesFlyout
            api={this.state.apiAvailableUpdateDetails}
            isVisible={!!this.state.apiAvailableUpdateDetails}
            onClose={() =>
              this.setState({ apiAvailableUpdateDetails: undefined })
            }
          />
        </EuiPage>
      );
    }
  },
);

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
  copyToClipBoard: PropTypes.func,
};
