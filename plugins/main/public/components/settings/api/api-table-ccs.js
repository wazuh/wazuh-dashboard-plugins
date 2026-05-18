/*
 * Wazuh app - API connections table for CCS (Cross-Cluster Search) mode.
 *
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
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
  EuiInMemoryTable,
} from '@elastic/eui';
import {
  getWazuhCheckUpdatesPlugin,
  getWazuhCorePlugin,
} from '../../../kibana-services';
import { AvailableUpdatesFlyout } from './available-updates-flyout';
import { AddApi } from './add-api';
import {
  WzButtonOpenFlyout,
  WzButtonPermissionsOpenFlyout,
} from '../../common/buttons';
import { WzButtonPermissions } from '../../common/permissions/button';

export const ApiTableCCS = ({
  items,
  versionData,
  isLoading,
  isUpdatesEnabled,
  selectedAPIConnection,
  refreshingAvailableUpdates,
  refreshingEntries,
  incremental,
  apiIsDown,
  availableUpdates,
  copyToClipBoard,
  setDefault,
  checkApi,
  refresh,
  getApisAvailableUpdates,
}) => {
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

  const columns = [
    {
      field: 'id',
      name: 'ID',
      align: 'left',
      sortable: true,
      render: item => {
        return <EuiText size='s'>{item}</EuiText>;
      },
    },
    {
      field: 'cluster_info.cluster',
      name: 'Cluster',
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
                    onClick={() => copyToClipBoard(item.downReason)}
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
                    onClick={() => copyToClipBoard(item.downReason)}
                  />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
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
        return value === getWazuhCorePlugin().API_USER_STATUS_RUN_AS.ENABLED ? (
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
      name: 'Verify CA',
      field: 'verify_ca',
      align: 'center',
      sortable: true,
      width: '80px',
      render: (value, row) => {
        const verify_ca = row.verify_ca;

        if (verify_ca === true) {
          return (
            <EuiToolTip
              position='top'
              content='CA certificate verification is enabled.'
            >
              <EuiIcon type='check' />
            </EuiToolTip>
          );
        } else if (verify_ca === false) {
          return (
            <EuiToolTip
              position='top'
              content='CA certificate verification is disabled. Either certificate paths are not configured.'
            >
              <p>-</p>
            </EuiToolTip>
          );
        } else {
          return (
            <EuiToolTip
              position='top'
              content='CA certificate verification status is unknown.'
            >
              <p>-</p>
            </EuiToolTip>
          );
        }
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
              item.id === selectedAPIConnection ? 'starFilled' : 'starEmpty'
            }
            aria-label='Set as default'
            onClick={async () => {
              const currentDefault = await setDefault(item);
              // state update is handled in ApiTable
            }}
          />
          <EuiToolTip position='top' content={<p>Check connection</p>}>
            <EuiButtonIcon
              aria-label='Check connection'
              iconType='refresh'
              onClick={async () => await checkApi(item)}
              color='success'
            />
          </EuiToolTip>
        </EuiFlexGroup>
      ),
    },
  ];

  // optional column if Check Updates is enabled
  const currentVersionColumn = {
    field: 'current_version',
    name: 'Version',
    align: 'left',
    sortable: true,
  };

  // optional column if Check Updates is enabled
  const versionStatusColumn = {
    field: 'version_status',
    name: 'Updates status',
    sortable: true,
    render: (item, api) => {
      const color = API_UPDATES_STATUS_COLUMN[item]?.color ?? 'subdued';

      const content = API_UPDATES_STATUS_COLUMN[item]?.text ?? 'Never checked';

      if (!refreshingAvailableUpdates) {
        return (
          <EuiFlexGroup alignItems='center' gutterSize='xs' responsive={false}>
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
                  flyoutTitle={'Available updates'}
                  flyoutBody={() => {
                    return <AvailableUpdatesFlyout updates={versionData} />;
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
                    onClick={() => copyToClipBoard(api.error.detail)}
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
  };

  if (isUpdatesEnabled) {
    columns.splice(7, 0, currentVersionColumn, versionStatusColumn);
  }

  const search = {
    box: {
      incremental: incremental,
      schema: true,
    },
  };

  const checkAPIHostsConnectionButton = (
    <EuiButton
      onClick={async () =>
        await refresh({
          selectAPIHostOnAvailable: true,
        })
      }
      isDisabled={refreshingEntries}
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
              onClick={async () => await refresh()}
            >
              Refresh
            </EuiButtonEmpty>
          </EuiFlexItem>
          {isUpdatesEnabled && (
            <>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType='refresh'
                  onClick={async () =>
                    await getApisAvailableUpdates(true, true)
                  }
                >
                  <span>
                    Check updates{' '}
                    <EuiToolTip
                      title='Last dashboard check'
                      content={
                        availableUpdates?.last_check_date_dashboard
                          ? getWazuhCorePlugin().utils.formatUIDate(
                              availableUpdates.last_check_date,
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
              From here you can manage and configure the API entries. You can
              also check their connection and status.
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        {apiIsDown && (
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiCallOut
                title='The API connections could be down or inaccessible'
                iconType='alert'
                color='warning'
              >
                <EuiFlexGroup>
                  <EuiFlexItem grow={false}>
                    <WzButtonOpenFlyout
                      flyoutTitle={
                        'The API connections could be down or inaccessible'
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

                        return <EuiSteps firstStepNumber={1} steps={steps} />;
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
};
