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
  EuiCallOut,
  EuiSpacer,
  EuiSteps,
  EuiCopy,
  EuiCodeBlock,
  EuiButton,
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
import { AddApi } from './add-api';
import {
  WzButtonOpenFlyout,
  WzButtonPermissionsOpenFlyout,
  WzButtonPermissionsModalConfirm,
} from '../../common/buttons';
import {
  ApiCheck,
  ErrorHandler,
  GenericRequest,
} from '../../../react-services';

export const ApiTable = compose(
  withErrorBoundary,
  withReduxProvider,
)(
  class ApiTable extends Component {
    constructor(props) {
      super(props);

      let selectedAPIConnection = null;
      try {
        const currentApi = AppState.getCurrentAPI();

        if (currentApi) {
          const { id } = JSON.parse(currentApi);
          selectedAPIConnection = id;
        }
      } catch (error) {}

      this.state = {
        apiEntries: [],
        selectedAPIConnection,
        refreshingEntries: false,
        availableUpdates: {},
        refreshingAvailableUpdates: true,
      };
    }

    async getApisAvailableUpdates(queryApi = false, forceQuery = false) {
      try {
        this.setState({ refreshingAvailableUpdates: true });
        const availableUpdates =
          await getWazuhCheckUpdatesPlugin().getAvailableUpdates(
            queryApi,
            forceQuery,
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
            title: `Error checking available updates: ${
              error.message || error
            }`,
          },
        };

        getErrorOrchestrator().handleError(options);
      } finally {
        this.setState({ refreshingAvailableUpdates: false });
      }
    }

    componentDidMount() {
      this.refresh();

      this.getApisAvailableUpdates();
    }

    copyToClipBoard(msg) {
      const el = document.createElement('textarea');
      el.value = msg;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      ErrorHandler.info('Error copied to the clipboard');
    }

    async checkManager(APIConnection, silent = false) {
      try {
        // Get the Api information
        const { username, url, port, id } = APIConnection;

        // Test the connection
        const response = await ApiCheck.checkApi(
          {
            username: username,
            url: url,
            port: port,
            cluster_info: {},
            insecure: 'true',
            id: id,
          },
          true,
        );
        APIConnection.cluster_info = response.data;
        APIConnection.status = 'online';
        APIConnection.allow_run_as = response.data.allow_run_as;
        !silent && ErrorHandler.info('Connection success', 'Settings');
        // WORKAROUND: Update the apiEntries with the modifications of the APIConnection object
        this.setState({
          apiEntries: this.state.apiEntries,
        });
      } catch (error) {
        if (!silent) {
          const options = {
            context: `${ApiTable.name}.checkManager`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            error: {
              error: error,
              message: error.message || error,
              title: error.name || error,
            },
          };
          getErrorOrchestrator().handleError(options);
        }
        throw error;
      }
    }

    async setDefault(APIconnection) {
      try {
        await this.checkManager(APIconnection, true);
        const { cluster_info, id } = APIconnection;
        const { manager, cluster, status } = cluster_info;

        // Check the connection before set as default
        AppState.setClusterInfo(cluster_info);
        const clusterEnabled = status === 'disabled';
        AppState.setCurrentAPI(
          JSON.stringify({
            name: clusterEnabled ? manager : cluster,
            id: id,
          }),
        );

        const currentApi = AppState.getCurrentAPI();
        const currentApiJSON = JSON.parse(currentApi);

        ErrorHandler.info(`API with id ${currentApiJSON.id} set as default`);

        this.setState({ selectedAPIConnection: currentApiJSON.id });
      } catch (error) {
        const options = {
          context: `${ApiTable.name}.setDefault`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }
    async refreshAPI(APIconnection, options) {
      try {
        const data = await ApiCheck.checkApi(APIconnection, true);
        const clusterInfo = data.data || {};
        APIconnection.status = 'online';
        APIconnection.cluster_info = clusterInfo;
        APIconnection.allow_run_as = clusterInfo.allow_run_as;
        if (options?.selectAPIHostOnAvailable) {
          this.setDefault(entry);
        }
      } catch (error) {
        const code = ((error || {}).data || {}).code;
        const downReason =
          typeof error === 'string'
            ? error
            : (error || {}).message ||
              ((error || {}).data || {}).message ||
              'API is not reachable';
        const status = code === 3099 ? 'down' : 'unknown';
        APIconnection.status = { status, downReason };
        if (APIconnection.id === this.state.selectedAPIConnection) {
          // if the selected API is down, we remove it so a new one will selected
          AppState.removeCurrentAPI();
        }
        throw new Error(error);
      }
    }
    /**
     * Refresh the API entries
     */
    async refresh(options = { selectAPIHostOnAvailable: false }) {
      try {
        let status = 'complete';
        this.setState({ error: false, refreshingEntries: true });
        const responseAPIHosts = await GenericRequest.request(
          'GET',
          '/hosts/apis',
          {},
        );
        const hosts = responseAPIHosts.data || [];
        this.setState({
          apiEntries: hosts.map(host => ({ ...host, status: 'checking' })),
        });
        const entries = [...hosts];
        let numErr = 0;
        for (let idx in entries) {
          const entry = entries[idx];
          try {
            await this.refreshAPI(entry, options);
          } catch (error) {
            numErr = numErr + 1;
          }
        }
        this.setState({
          apiEntries: entries,
          status: status,
          refreshingEntries: false,
          apiIsDown: entries.length > 0 && numErr >= entries.length,
        });
      } catch (error) {
        this.setState({
          refreshingEntries: false,
        });
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
          const downReason =
            typeof error === 'string'
              ? error
              : (error || {}).message ||
                ((error || {}).data || {}).message ||
                'API is not reachable';
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
            title: `Error checking manager connection: ${
              error.message || error
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
            if (item === 'checking') {
              return (
                <span>
                  <EuiLoadingSpinner size='s' />
                  <span>&nbsp;&nbsp;Checking</span>
                </span>
              );
            }
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
                        onClick={() => this.copyToClipBoard(item.downReason)}
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
                        onClick={() => this.copyToClipBoard(item.downReason)}
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                </EuiFlexGroup>
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
                      <WzButtonOpenFlyout
                        tooltip={{ content: 'View available updates' }}
                        flyoutTitle={'Availabe updates'}
                        flyoutBody={() => {
                          return <AvailableUpdatesFlyout api={api} />;
                        }}
                        buttonProps={{
                          buttonType: 'icon',
                          iconType: 'eye',
                        }}
                      />
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
                          onClick={() => this.copyToClipBoard(api.error.detail)}
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
              <EuiToolTip
                position='top'
                content='The configured API user does not use authentication context.'
              >
                <p>-</p>
              </EuiToolTip>
            );
          },
        },
        {
          name: 'Actions',
          render: item => (
            <EuiFlexGroup>
              <WzButtonPermissions
                buttonType='icon'
                tooltip={{ position: 'top', content: <p>Set as default</p> }}
                iconType={
                  item.id === this.state.selectedAPIConnection
                    ? 'starFilled'
                    : 'starEmpty'
                }
                aria-label='Set as default'
                onClick={async () => {
                  const currentDefault = await this.setDefault(item);
                  this.setState({
                    currentDefault,
                  });
                }}
              />
              <EuiToolTip position='top' content={<p>Check connection</p>}>
                <EuiButtonIcon
                  aria-label='Check connection'
                  iconType='refresh'
                  onClick={async () => await this.checkApi(item)}
                  color='success'
                />
              </EuiToolTip>
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

      const checkAPIHostsConnectionButton = (
        <EuiButton
          onClick={async () =>
            await this.refresh({
              selectAPIHostOnAvailable: true,
            })
          }
          isDisabled={this.state.refreshingEntries}
        >
          Check connection
        </EuiButton>
      );

      return (
        <EuiPage>
          <EuiPanel paddingSize='l'>
            <EuiFlexGroup alignItems='center'>
              <EuiFlexItem>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle>
                      <h2>API Connections</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <WzButtonPermissionsOpenFlyout
                  flyoutTitle='Add API connection'
                  flyoutBody={() => <AddApi />}
                  buttonProps={{
                    administrator: true,
                    buttonType: 'empty',
                    iconType: 'plusInCircle',
                  }}
                >
                  Add API connection
                </WzButtonPermissionsOpenFlyout>
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
                  onClick={async () =>
                    await this.getApisAvailableUpdates(true, true)
                  }
                >
                  <span>
                    Check updates{' '}
                    <EuiToolTip
                      title='Last dashboard check'
                      content={
                        this.state.availableUpdates?.last_check_date
                          ? getWazuhCorePlugin().utils.formatUIDate(
                              this.state.availableUpdates.last_check_date,
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
            {this.state.apiIsDown && (
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCallOut
                    title='The API connections could be down or inaccesible'
                    iconType='alert'
                    color='warning'
                  >
                    <EuiFlexGroup>
                      <EuiFlexItem grow={false}>
                        <WzButtonOpenFlyout
                          flyoutTitle={
                            'The API connections could be down or inaccesible'
                          }
                          flyoutBody={() => {
                            const steps = [
                              {
                                title: 'Check the API server service status',
                                children: (
                                  <>
                                    {[
                                      {
                                        label: 'For Systemd',
                                        command:
                                          'sudo systemctl status wazuh-manager',
                                      },
                                      {
                                        label: 'For SysV Init',
                                        command:
                                          'sudo service wazuh-manager status',
                                      },
                                    ].map(({ label, command }) => (
                                      <>
                                        <EuiText>{label}</EuiText>
                                        <div className='copy-codeblock-wrapper'>
                                          <EuiCodeBlock
                                            style={{
                                              zIndex: '100',
                                              wordWrap: 'break-word',
                                            }}
                                            language='tsx'
                                          >
                                            {command}
                                          </EuiCodeBlock>
                                          <EuiCopy textToCopy={command}>
                                            {copy => (
                                              <div
                                                className='copy-overlay'
                                                onClick={copy}
                                              >
                                                <p>
                                                  <EuiIcon type='copy' /> Copy
                                                  command
                                                </p>
                                              </div>
                                            )}
                                          </EuiCopy>
                                        </div>
                                        <EuiSpacer />
                                      </>
                                    ))}
                                  </>
                                ),
                              },
                              {
                                title: 'Review the API hosts configuration',
                              },
                              {
                                title: 'Check the API hosts connection',
                                children: checkAPIHostsConnectionButton,
                              },
                            ];

                            return (
                              <EuiSteps firstStepNumber={1} steps={steps} />
                            );
                          }}
                          buttonProps={{
                            buttonType: 'empty',
                          }}
                        >
                          Troubleshooting
                        </WzButtonOpenFlyout>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        {checkAPIHostsConnectionButton}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiCallOut>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            <EuiInMemoryTable
              itemId='id'
              items={items}
              search={search}
              columns={columns}
              pagination={true}
              sorting={true}
              loading={isLoading}
              tableLayout='auto'
              message={
                !items.length ? 'No API connections. Add a new one.' : undefined
              }
            />
          </EuiPanel>
        </EuiPage>
      );
    }
  },
);
