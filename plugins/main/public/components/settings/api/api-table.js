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
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
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
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.checkUpdatesErrorTitle',
              {
                defaultMessage:
                  'Error checking available updates: {errorMessage}',
                values: { errorMessage: error.message || error },
              },
            ),
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
            ErrorHandler.info(
              i18n.translate(
                'wazuh.dashboardsSettings.apiTable.copyToClipboardSuccessToast',
                { defaultMessage: 'Text copied to clipboard' },
              ),
            );
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
        ErrorHandler.info(
          i18n.translate(
            'wazuh.dashboardsSettings.apiTable.copyToClipboardSuccessToast',
            { defaultMessage: 'Text copied to clipboard' },
          ),
        );
      } else {
        ErrorHandler.error(
          i18n.translate(
            'wazuh.dashboardsSettings.apiTable.copyToClipboardErrorToast',
            { defaultMessage: 'Could not copy text' },
          ),
        );
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
        !silent &&
          ErrorHandler.info(
            i18n.translate(
              'wazuh.dashboardsSettings.apiTable.connectionSuccessToast',
              { defaultMessage: 'Settings. Connection success' },
            ),
          );
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
          title:
            error.name ||
            i18n.translate(
              'wazuh.dashboardsSettings.apiTable.checkFailureErrorTitle',
              { defaultMessage: 'Error' },
            ),
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

        ErrorHandler.info(
          i18n.translate(
            'wazuh.dashboardsSettings.apiTable.setDefaultSuccessToast',
            {
              defaultMessage: 'API with id {apiId} set as default',
              values: { apiId: currentApiJSON.id },
            },
          ),
        );

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
              i18n.translate(
                'wazuh.dashboardsSettings.apiTable.apiNotReachable',
                { defaultMessage: 'API is not reachable' },
              );
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
                i18n.translate(
                  'wazuh.dashboardsSettings.apiTable.apiNotReachable',
                  { defaultMessage: 'API is not reachable' },
                );
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
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.checkConnectionErrorTitle',
              {
                defaultMessage:
                  'Error checking manager connection: {errorMessage}',
                values: { errorMessage: error.message || error },
              },
            ),
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
            <span>
              &nbsp;&nbsp;
              {i18n.translate(
                'wazuh.dashboardsSettings.apiTable.status.checking',
                { defaultMessage: 'Checking' },
              )}
            </span>
          </span>
        );
      }
      if (!item) {
        return null;
      }
      if (item === 'online') {
        return (
          <EuiHealth color='success' style={{ wordBreak: 'normal' }}>
            {i18n.translate('wazuh.dashboardsSettings.apiTable.status.online', {
              defaultMessage: 'Online',
            })}
          </EuiHealth>
        );
      }
      if (item.status === 'down') {
        return (
          <EuiFlexGroup alignItems='center' gutterSize='xs' responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiHealth color='warning' style={{ wordBreak: 'normal' }}>
                {i18n.translate(
                  'wazuh.dashboardsSettings.apiTable.status.warning',
                  { defaultMessage: 'Warning' },
                )}
              </EuiHealth>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position='top' content={item.downReason}>
                <EuiButtonIcon
                  color='primary'
                  iconType='questionInCircle'
                  aria-label={i18n.translate(
                    'wazuh.dashboardsSettings.apiTable.errorInfoAriaLabel',
                    { defaultMessage: 'Info about the error' },
                  )}
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
              {i18n.translate(
                'wazuh.dashboardsSettings.apiTable.status.offline',
                { defaultMessage: 'Offline' },
              )}
            </EuiHealth>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip position='top' content={item.downReason}>
              <EuiButtonIcon
                color='primary'
                iconType='questionInCircle'
                aria-label={i18n.translate(
                  'wazuh.dashboardsSettings.apiTable.errorInfoAriaLabel',
                  { defaultMessage: 'Info about the error' },
                )}
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
            content={i18n.translate(
              'wazuh.dashboardsSettings.apiTable.runAs.enabledTooltip',
              {
                defaultMessage:
                  'The configured API user uses the authentication context.',
              },
            )}
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
            content={i18n.translate(
              'wazuh.dashboardsSettings.apiTable.runAs.notAllowedTooltip',
              {
                defaultMessage:
                  'The configured API user is not allowed to use run_as. Give it permissions or set run_as with false value in the host configuration.',
              },
            )}
          >
            <EuiIcon color='danger' type='alert' />
          </EuiToolTip>
        );
      }
      return (
        <EuiToolTip
          position='top'
          content={i18n.translate(
            'wazuh.dashboardsSettings.apiTable.runAs.disabledTooltip',
            {
              defaultMessage:
                'The configured API user does not use authentication context.',
            },
          )}
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
            content={i18n.translate(
              'wazuh.dashboardsSettings.apiTable.verifyCa.enabledTooltip',
              { defaultMessage: 'CA certificate verification is enabled.' },
            )}
          >
            <EuiIcon type='check' />
          </EuiToolTip>
        );
      }
      if (verify_ca === false) {
        return (
          <EuiToolTip
            position='top'
            content={i18n.translate(
              'wazuh.dashboardsSettings.apiTable.verifyCa.disabledTooltip',
              {
                defaultMessage:
                  'CA certificate verification is disabled. Either certificate paths are not configured.',
              },
            )}
          >
            <p>-</p>
          </EuiToolTip>
        );
      }
      return (
        <EuiToolTip
          position='top'
          content={i18n.translate(
            'wazuh.dashboardsSettings.apiTable.verifyCa.unknownTooltip',
            {
              defaultMessage: 'CA certificate verification status is unknown.',
            },
          )}
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
        upToDate: {
          text: i18n.translate(
            'wazuh.dashboardsSettings.apiTable.updatesStatus.upToDate',
            { defaultMessage: 'Up to date' },
          ),
          color: 'success',
        },
        availableUpdates: {
          text: i18n.translate(
            'wazuh.dashboardsSettings.apiTable.updatesStatus.availableUpdates',
            { defaultMessage: 'Available updates' },
          ),
          color: 'warning',
        },
        disabled: {
          text: i18n.translate(
            'wazuh.dashboardsSettings.apiTable.updatesStatus.disabled',
            { defaultMessage: 'Checking updates disabled' },
          ),
          color: 'subdued',
        },
        error: {
          text: i18n.translate(
            'wazuh.dashboardsSettings.apiTable.updatesStatus.error',
            { defaultMessage: 'Error checking updates' },
          ),
          color: 'danger',
        },
      };

      const api = items[0];
      const listItems = [];

      if (api) {
        listItems.push(
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.id',
              { defaultMessage: 'ID' },
            ),
            description: <EuiText size='s'>{api.id}</EuiText>,
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.cluster',
              { defaultMessage: 'Cluster' },
            ),
            description: (
              <EuiText size='s'>{api.cluster_info?.cluster ?? '—'}</EuiText>
            ),
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.host',
              { defaultMessage: 'Host' },
            ),
            description: <EuiText size='s'>{api.url}</EuiText>,
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.port',
              { defaultMessage: 'Port' },
            ),
            description: <EuiText size='s'>{api.port}</EuiText>,
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.username',
              { defaultMessage: 'Username' },
            ),
            description: <EuiText size='s'>{api.username}</EuiText>,
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.status',
              { defaultMessage: 'Status' },
            ),
            description: this.renderStatusCell(api.status),
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.runAs',
              { defaultMessage: 'Run as' },
            ),
            description: this.renderRunAsCell(api.allow_run_as),
          },
          {
            title: i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.verifyCa',
              { defaultMessage: 'Verify CA' },
            ),
            description: this.renderVerifyCaCell(api.verify_ca),
          },
        );

        if (this.isUpdatesEnabled) {
          const vs = api.version_status;
          const color = API_UPDATES_STATUS_COLUMN[vs]?.color ?? 'subdued';
          const content =
            API_UPDATES_STATUS_COLUMN[vs]?.text ??
            i18n.translate(
              'wazuh.dashboardsSettings.apiTable.updatesStatus.neverChecked',
              { defaultMessage: 'Never checked' },
            );
          listItems.push(
            {
              title: i18n.translate(
                'wazuh.dashboardsSettings.apiTable.details.version',
                { defaultMessage: 'Version' },
              ),
              description: (
                <EuiText size='s'>{api.current_version ?? '—'}</EuiText>
              ),
            },
            {
              title: i18n.translate(
                'wazuh.dashboardsSettings.apiTable.details.updatesStatus',
                { defaultMessage: 'Updates status' },
              ),
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
                            <FormattedMessage
                              id='wazuh.dashboardsSettings.apiTable.updatesStatus.neverCheckedTooltip'
                              defaultMessage='Click {checkUpdates} to get information'
                              values={{
                                checkUpdates: (
                                  <b>
                                    {i18n.translate(
                                      'wazuh.dashboardsSettings.apiTable.updatesStatus.neverCheckedTooltipButton',
                                      { defaultMessage: 'Check updates' },
                                    )}
                                  </b>
                                ),
                              }}
                            />
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
                        tooltip={{
                          content: i18n.translate(
                            'wazuh.dashboardsSettings.apiTable.updatesStatus.viewAvailableUpdatesTooltip',
                            { defaultMessage: 'View available updates' },
                          ),
                        }}
                        flyoutTitle={i18n.translate(
                          'wazuh.dashboardsSettings.apiTable.availableUpdatesFlyout.title',
                          { defaultMessage: 'Available updates' },
                        )}
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
                          aria-label={i18n.translate(
                            'wazuh.dashboardsSettings.apiTable.errorInfoAriaLabel',
                            { defaultMessage: 'Info about the error' },
                          )}
                          onClick={() => this.copyToClipBoard(api.error.detail)}
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              ) : (
                <span>
                  <EuiLoadingSpinner size='s' />
                  &nbsp;&nbsp;
                  {i18n.translate(
                    'wazuh.dashboardsSettings.apiTable.status.checking',
                    { defaultMessage: 'Checking' },
                  )}
                </span>
              ),
            },
          );
        }
      }

      if (isLoading && !api) {
        return (
          <EuiText>
            <EuiLoadingSpinner size='m' />{' '}
            {i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.loading',
              { defaultMessage: 'Loading…' },
            )}
          </EuiText>
        );
      }
      if (!api) {
        return (
          <EuiText color='subdued'>
            {i18n.translate(
              'wazuh.dashboardsSettings.apiTable.details.noItemsMessage',
              { defaultMessage: 'No API connection configured.' },
            )}
          </EuiText>
        );
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
                      <h2>
                        {i18n.translate(
                          'wazuh.dashboardsSettings.apiTable.title',
                          { defaultMessage: 'API connection' },
                        )}
                      </h2>
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
                      {i18n.translate(
                        'wazuh.dashboardsSettings.apiTable.refreshButton',
                        { defaultMessage: 'Refresh' },
                      )}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiToolTip
                      position='top'
                      content={
                        <p>
                          {i18n.translate(
                            'wazuh.dashboardsSettings.apiTable.refreshTooltip',
                            {
                              defaultMessage:
                                'Reloads the API entry from the dashboard configuration and runs a connectivity check against the Wazuh manager. If the manager is available, the API entry is updated.',
                            },
                          )}
                        </p>
                      }
                    >
                      <EuiButtonIcon
                        display='empty'
                        color='primary'
                        iconType='questionInCircle'
                        aria-label={i18n.translate(
                          'wazuh.dashboardsSettings.apiTable.refreshTooltipAriaLabel',
                          { defaultMessage: 'What Refresh does' },
                        )}
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
                        {i18n.translate(
                          'wazuh.dashboardsSettings.apiTable.checkUpdatesButton',
                          { defaultMessage: 'Check updates' },
                        )}{' '}
                        <EuiToolTip
                          title={i18n.translate(
                            'wazuh.dashboardsSettings.apiTable.lastDashboardCheckTooltip',
                            { defaultMessage: 'Last dashboard check' },
                          )}
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
                  {i18n.translate(
                    'wazuh.dashboardsSettings.apiTable.description',
                    {
                      defaultMessage:
                        'The manager API entry configured for this dashboard and its current status.',
                    },
                  )}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            {this.state.apiIsDown && (
              <EuiFlexGroup
                style={{ marginBottom: firstItem ? '15px' : '0px' }}
              >
                <EuiFlexItem>
                  <EuiCallOut
                    title={i18n.translate(
                      'wazuh.dashboardsSettings.apiTable.apiDownCallout.title',
                      {
                        defaultMessage:
                          'Connection issue detected on the active API',
                      },
                    )}
                    iconType='alert'
                    color='danger'
                  >
                    <EuiText size='s'>
                      {i18n.translate(
                        'wazuh.dashboardsSettings.apiTable.apiDownCallout.description',
                        {
                          defaultMessage:
                            'The current API host is unreachable or not responding. Review the configuration and validate connectivity.',
                        },
                      )}
                    </EuiText>
                    <EuiSpacer size='s' />
                    <EuiFlexGroup>
                      <EuiFlexItem grow={false}>
                        <WzButtonOpenFlyout
                          flyoutTitle={i18n.translate(
                            'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.title',
                            {
                              defaultMessage:
                                'The API connection could be down or inaccessible',
                            },
                          )}
                          flyoutBody={() => {
                            const steps = [
                              {
                                title: i18n.translate(
                                  'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.checkServiceStep',
                                  {
                                    defaultMessage:
                                      'Check the API server service status',
                                  },
                                ),
                                children: (
                                  <>
                                    {[
                                      {
                                        label: i18n.translate(
                                          'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.systemdLabel',
                                          { defaultMessage: 'For Systemd' },
                                        ),
                                        command:
                                          'sudo systemctl status wazuh-manager',
                                      },
                                      {
                                        label: i18n.translate(
                                          'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.sysVInitLabel',
                                          { defaultMessage: 'For SysV Init' },
                                        ),
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
                                                  <EuiIcon type='copy' />{' '}
                                                  {i18n.translate(
                                                    'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.copyCommand',
                                                    {
                                                      defaultMessage:
                                                        'Copy command',
                                                    },
                                                  )}
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
                                title: i18n.translate(
                                  'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.reviewConfigurationStep',
                                  {
                                    defaultMessage:
                                      'Review the API host configuration',
                                  },
                                ),
                              },
                              {
                                title: i18n.translate(
                                  'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.checkConnectionStep',
                                  {
                                    defaultMessage: 'Check the API connection',
                                  },
                                ),
                                children: (
                                  <>
                                    <EuiText size='s'>
                                      {i18n.translate(
                                        'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.checkConnectionStepDescription',
                                        {
                                          defaultMessage:
                                            'Reload the API configuration from the dashboard host and verify manager connectivity.',
                                        },
                                      )}
                                    </EuiText>
                                    <EuiSpacer size='s' />
                                    <EuiButton
                                      iconType='refresh'
                                      onClick={async () =>
                                        await this.refreshFromUi()
                                      }
                                      isLoading={this.state.refreshingEntries}
                                    >
                                      {i18n.translate(
                                        'wazuh.dashboardsSettings.apiTable.troubleshootingFlyout.refreshButton',
                                        { defaultMessage: 'Refresh' },
                                      )}
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
                          {i18n.translate(
                            'wazuh.dashboardsSettings.apiTable.troubleshootingButton',
                            { defaultMessage: 'Troubleshooting' },
                          )}
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
