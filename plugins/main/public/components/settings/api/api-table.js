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
  EuiDescriptionList,
  EuiProgress,
} from '@elastic/eui';
import { AppState } from '../../../react-services/app-state';
import { withErrorBoundary } from '../../common/hocs';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import {
  getWazuhCheckUpdatesPlugin,
  getWazuhCorePlugin,
} from '../../../kibana-services';
import { AvailableUpdatesFlyout } from './available-updates-flyout';
import { AddApi } from './add-api';
import { ApiTableCCS } from './api-table-ccs';
import {
  WzButtonOpenFlyout,
  WzButtonPermissionsOpenFlyout,
} from '../../common/buttons';
import { WzButtonPermissions } from '../../common/permissions/button';
import {
  ApiCheck,
  ErrorHandler,
  GenericRequest,
} from '../../../react-services';
import { WzAuthentication } from '../../../react-services/wz-authentication';

export const ApiTable = compose(
  withErrorBoundary,
  connect(state => ({ isCCS: state.appStateReducers.isCCS })),
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
        refreshingAvailableUpdates: false,
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

    async componentDidMount() {
      this.refresh();
      this.isUpdatesEnabled = !(await getWazuhCorePlugin().configuration.get(
        'wazuh.updates.disabled',
      ));

      if (this.isUpdatesEnabled) {
        this.getApisAvailableUpdates();
      }
    }

    copyToClipBoard(msg) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(msg)
          .then(() => {
            ErrorHandler.info('Text copied to clipboard');
          })
          .catch(() => {
            this.fallbackCopyToClipboard(msg);
          });
      } else {
        this.fallbackCopyToClipboard(msg); // old method
      }
    }

    fallbackCopyToClipboard(msg) {
      const el = document.createElement('textarea');
      el.value = msg;
      document.body.appendChild(el);
      el.select();
      let successful = false;
      successful = document.execCommand('copy');
      document.body.removeChild(el);
      if (successful) {
        ErrorHandler.info('Text copied to clipboard');
      } else {
        ErrorHandler.error('Could not copy text');
      }
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
        const { allow_run_as, verify_ca, ...cluster_info } = response.data;
        APIConnection.cluster_info = cluster_info;
        APIConnection.status = 'online';
        APIConnection.allow_run_as = allow_run_as;
        APIConnection.verify_ca = verify_ca;
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

    notifyManagerCheckFailure(error, context) {
      const message = error.message || error;
      getErrorOrchestrator().handleError({
        context: `${ApiTable.name}.${context}`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message,
          title: error.name || 'Error',
        },
      });
    }

    async setDefault(APIconnection) {
      try {
        await this.checkManager(APIconnection, true);
        const { cluster_info, id } = APIconnection;
        const { cluster } = cluster_info;

        // Check the connection before set as default
        AppState.setClusterInfo(cluster_info);
        AppState.setCurrentAPI(
          JSON.stringify({
            name: cluster,
            id: id,
          }),
        );

        // Update the server-side wz-api cookie to match the newly selected host
        await WzAuthentication.refresh(true);

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
    async refreshAPI(APIconnection) {
      try {
        const data = await ApiCheck.checkApi(APIconnection, true);
        const clusterInfo = data.data || {};
        const { allow_run_as, verify_ca, ...cluster_info } = clusterInfo;
        APIconnection.status = 'online';
        APIconnection.cluster_info = cluster_info;
        APIconnection.allow_run_as = allow_run_as;
        APIconnection.verify_ca = verify_ca;
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
        throw error;
      }
    }
    /**
     * Refresh the API entries
     */
    async refresh(options = {}) {
      const { selectAPIHostOnAvailable = false, notifyCheckFailure = false } =
        options;
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
        let refreshCheckError = null;
        for (let idx in entries) {
          const entry = entries[idx];
          try {
            await this.refreshAPI(entry);
          } catch (error) {
            numErr = numErr + 1;
            if (!refreshCheckError) {
              refreshCheckError = error;
            }
          }
        }
        if (notifyCheckFailure && refreshCheckError) {
          this.notifyManagerCheckFailure(refreshCheckError, 'refresh');
        }
        if (selectAPIHostOnAvailable) {
          const isCCS = this.props.isCCS;
          const selectedId = this.state.selectedAPIConnection;
          const onlineEntries = entries.filter(e => e.status === 'online');
          const target = isCCS
            ? onlineEntries.find(e => e.id === selectedId) ?? onlineEntries[0]
            : onlineEntries[0];
          if (target) {
            await this.setDefault(target);
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

    async refreshFromUi() {
      await this.refresh({
        notifyCheckFailure: true,
        selectAPIHostOnAvailable: true,
      });
    }

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

    renderStatusCell(item) {
      if (item === 'checking') {
        return (
          <span>
            <EuiLoadingSpinner size='s' />
            <span>&nbsp;&nbsp;Checking</span>
          </span>
        );
      }
      if (!item) {
        return null;
      }
      if (item === 'online') {
        return (
          <EuiHealth color='success' style={{ wordBreak: 'normal' }}>
            Online
          </EuiHealth>
        );
      }
      if (item.status === 'down') {
        return (
          <EuiFlexGroup alignItems='center' gutterSize='xs' responsive={false}>
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
        );
      }
      return (
        <EuiFlexGroup alignItems='center' gutterSize='xs' responsive={false}>
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

    renderRunAsCell(value) {
      if (value === getWazuhCorePlugin().API_USER_STATUS_RUN_AS.ENABLED) {
        return (
          <EuiToolTip
            position='top'
            content='The configured API user uses the authentication context.'
          >
            <EuiIcon type='check' />
          </EuiToolTip>
        );
      }
      if (
        value === getWazuhCorePlugin().API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED
      ) {
        return (
          <EuiToolTip
            position='top'
            content='The configured API user is not allowed to use run_as. Give it permissions or set run_as with false value in the host configuration.'
          >
            <EuiIcon color='danger' type='alert' />
          </EuiToolTip>
        );
      }
      return (
        <EuiToolTip
          position='top'
          content='The configured API user does not use authentication context.'
        >
          <p>-</p>
        </EuiToolTip>
      );
    }

    renderVerifyCaCell(verify_ca) {
      if (verify_ca === true) {
        return (
          <EuiToolTip
            position='top'
            content='CA certificate verification is enabled.'
          >
            <EuiIcon type='check' />
          </EuiToolTip>
        );
      }
      if (verify_ca === false) {
        return (
          <EuiToolTip
            position='top'
            content='CA certificate verification is disabled. Either certificate paths are not configured.'
          >
            <p>-</p>
          </EuiToolTip>
        );
      }
      return (
        <EuiToolTip
          position='top'
          content='CA certificate verification status is unknown.'
        >
          <p>-</p>
        </EuiToolTip>
      );
    }

    renderTable(items, versionData, isLoading) {
      return (
        <ApiTableCCS
          items={items}
          versionData={versionData}
          isLoading={isLoading}
          isUpdatesEnabled={this.isUpdatesEnabled}
          selectedAPIConnection={this.state.selectedAPIConnection}
          refreshingAvailableUpdates={this.state.refreshingAvailableUpdates}
          refreshingEntries={this.state.refreshingEntries}
          incremental={this.state.incremental}
          apiIsDown={this.state.apiIsDown}
          availableUpdates={this.state.availableUpdates}
          copyToClipBoard={this.copyToClipBoard.bind(this)}
          setDefault={this.setDefault.bind(this)}
          checkApi={this.checkApi.bind(this)}
          refresh={this.refresh.bind(this)}
          getApisAvailableUpdates={this.getApisAvailableUpdates.bind(this)}
        />
      );
    }

    renderDescriptionList(items, versionData, isLoading) {
      const API_UPDATES_STATUS_COLUMN = {
        upToDate: { text: 'Up to date', color: 'success' },
        availableUpdates: { text: 'Available updates', color: 'warning' },
        disabled: { text: 'Checking updates disabled', color: 'subdued' },
        error: { text: 'Error checking updates', color: 'danger' },
      };

      const api = items[0];
      const listItems = [];

      if (api) {
        listItems.push(
          { title: 'ID', description: <EuiText size='s'>{api.id}</EuiText> },
          {
            title: 'Cluster',
            description: (
              <EuiText size='s'>{api.cluster_info?.cluster ?? '—'}</EuiText>
            ),
          },
          { title: 'Host', description: <EuiText size='s'>{api.url}</EuiText> },
          {
            title: 'Port',
            description: <EuiText size='s'>{api.port}</EuiText>,
          },
          {
            title: 'Username',
            description: <EuiText size='s'>{api.username}</EuiText>,
          },
          { title: 'Status', description: this.renderStatusCell(api.status) },
          {
            title: 'Run as',
            description: this.renderRunAsCell(api.allow_run_as),
          },
          {
            title: 'Verify CA',
            description: this.renderVerifyCaCell(api.verify_ca),
          },
        );

        if (this.isUpdatesEnabled) {
          const vs = api.version_status;
          const color = API_UPDATES_STATUS_COLUMN[vs]?.color ?? 'subdued';
          const content =
            API_UPDATES_STATUS_COLUMN[vs]?.text ?? 'Never checked';
          listItems.push(
            {
              title: 'Version',
              description: (
                <EuiText size='s'>{api.current_version ?? '—'}</EuiText>
              ),
            },
            {
              title: 'Updates status',
              description: !this.state.refreshingAvailableUpdates ? (
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
                  {!vs && (
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position='top'
                        content={
                          <p>
                            Click <b>Check updates</b> to get information
                          </p>
                        }
                      >
                        <EuiButtonIcon
                          aria-label={content}
                          iconType='questionInCircle'
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  )}
                  {vs === 'availableUpdates' && (
                    <EuiFlexItem grow={false}>
                      <WzButtonOpenFlyout
                        tooltip={{ content: 'View available updates' }}
                        flyoutTitle='Available updates'
                        flyoutBody={() => (
                          <AvailableUpdatesFlyout updates={versionData} />
                        )}
                        buttonProps={{ buttonType: 'icon', iconType: 'eye' }}
                      />
                    </EuiFlexItem>
                  )}
                  {vs === 'error' && api.error?.detail && (
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
                  )}
                </EuiFlexGroup>
              ) : (
                <span>
                  <EuiLoadingSpinner size='s' />
                  &nbsp;&nbsp;Checking
                </span>
              ),
            },
          );
        }
      }

      if (isLoading && !api) {
        return (
          <EuiText>
            <EuiLoadingSpinner size='m' /> Loading…
          </EuiText>
        );
      }
      if (!api) {
        return <EuiText color='subdued'>No API connection configured.</EuiText>;
      }
      return (
        <EuiFlexGroup>
          {listItems.map(item => (
            <EuiFlexItem key={item.title}>
              <EuiDescriptionList compressed listItems={[item]} />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      );
    }

    render() {
      const isLoading =
        this.state.refreshingEntries || this.state.refreshingAvailableUpdates;

      const versionData = this.state.availableUpdates || {};
      const items = [
        ...this.state.apiEntries?.map(apiEntry => ({
          ...versionData,
          ...apiEntry,
          version_status: versionData.status,
        })),
      ];

      if (this.props.isCCS) {
        return this.renderTable(items, versionData, isLoading);
      }

      const { DismissNotificationCheck } = getWazuhCheckUpdatesPlugin();
      const firstItem = items[0];

      return (
        <EuiPage>
          <EuiPanel paddingSize='m'>
            {this.state.refreshingEntries && (
              <>
                <EuiProgress size='xs' color='primary' position='absolute' />
              </>
            )}
            <EuiFlexGroup alignItems='center'>
              <EuiFlexItem>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle>
                      <h2>API connection</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup
                  gutterSize='xs'
                  alignItems='center'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      iconType='refresh'
                      onClick={async () => await this.refreshFromUi()}
                      isLoading={this.state.refreshingEntries}
                    >
                      Refresh
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiToolTip
                      position='top'
                      content={
                        <p>
                          Reloads the API entry from the dashboard configuration
                          and runs a connectivity check against the Wazuh
                          manager. If the manager is available, the API entry is
                          updated.
                        </p>
                      }
                    >
                      <EuiButtonIcon
                        display='empty'
                        color='primary'
                        iconType='questionInCircle'
                        aria-label='What Refresh does'
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              {this.isUpdatesEnabled && (
                <>
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
                            this.state.availableUpdates
                              ?.last_check_date_dashboard
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
                </>
              )}
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiText color='subdued' style={{ paddingBottom: '15px' }}>
                  The manager API entry configured for this dashboard and its
                  current status.
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            {this.state.apiIsDown && (
              <EuiFlexGroup
                style={{ marginBottom: firstItem ? '15px' : '0px' }}
              >
                <EuiFlexItem>
                  <EuiCallOut
                    title='Connection issue detected on the active API'
                    iconType='alert'
                    color='danger'
                  >
                    <EuiText size='s'>
                      The current API host is unreachable or not responding.
                      Review the configuration and validate connectivity.
                    </EuiText>
                    <EuiSpacer size='s' />
                    <EuiFlexGroup>
                      <EuiFlexItem grow={false}>
                        <WzButtonOpenFlyout
                          flyoutTitle={
                            'The API connection could be down or inaccessible'
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
                                title: 'Review the API host configuration',
                              },
                              {
                                title: 'Check the API connection',
                                children: (
                                  <>
                                    <EuiText size='s'>
                                      Reload the API configuration from the
                                      dashboard host and verify manager
                                      connectivity.
                                    </EuiText>
                                    <EuiSpacer size='s' />
                                    <EuiButton
                                      iconType='refresh'
                                      onClick={async () =>
                                        await this.refreshFromUi()
                                      }
                                      isLoading={this.state.refreshingEntries}
                                    >
                                      Refresh
                                    </EuiButton>
                                  </>
                                ),
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
                    </EuiFlexGroup>
                  </EuiCallOut>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            {this.renderDescriptionList(items, versionData, isLoading)}
          </EuiPanel>
        </EuiPage>
      );
    }
  },
);
