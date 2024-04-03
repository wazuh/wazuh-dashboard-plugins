import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiHealth,
  EuiLoadingSpinner,
  EuiButtonIcon,
  EuiIcon,
} from '@elastic/eui';
import { API_USER_STATUS_RUN_AS } from '../../../../server/lib/cache-api-user-has-run-as';
import { WzButtonPermissions } from '../../common/permissions/button';

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

export const getApiTableColumns = ({
  isUpdatesEnabled,
  checkApi,
  copyToClipBoard,
  setDefault,
  currentDefault,
  refreshingAvailableUpdates,
  viewApiAvailableUpdateDetails,
}) => {
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
        return value === API_USER_STATUS_RUN_AS.ENABLED ? (
          <EuiToolTip
            position='top'
            content='The configured API user uses the authentication context.'
          >
            <EuiIcon type='check' />
          </EuiToolTip>
        ) : value === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED ? (
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
          <EuiFlexItem grow={false}>
            <WzButtonPermissions
              buttonType='icon'
              roles={[]}
              tooltip={{ position: 'top', content: <p>Set as default</p> }}
              iconType={item.id === currentDefault ? 'starFilled' : 'starEmpty'}
              aria-label='Set as default'
              onClick={async () => {
                await setDefault(item);
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip position='top' content={<p>Check connection</p>}>
              <EuiButtonIcon
                aria-label='Check connection'
                iconType='refresh'
                onClick={async () => await checkApi(item)}
                color='success'
              />
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];
  if (isUpdatesEnabled) {
    columns.splice(
      7,
      0,
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

          if (!refreshingAvailableUpdates) {
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
                        onClick={() => viewApiAvailableUpdateDetails(api)}
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
      },
    );
  }
  return columns;
};
