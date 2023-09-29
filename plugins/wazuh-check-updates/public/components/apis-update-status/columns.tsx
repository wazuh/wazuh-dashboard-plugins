import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiHealth, EuiIconTip } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { formatUIDate } from '../../utils';
import { APIAvailableUpdates } from '../../../common/types';

export const apisUpdateStatusColumns = [
  {
    field: 'apiId',
    name: 'ID',
    width: '150px',
  },
  {
    field: 'version',
    name: 'Version',
    width: '150px',
  },
  {
    field: 'upToDate',
    name: 'Update status',
    width: '200px',
    render: (isUpToDate: boolean, item: any) => {
      const getI18nMessageId = () => {
        if (isUpToDate) {
          return 'upToDate';
        }
        return 'availableUpdates';
      };

      const getDefaultMessage = () => {
        if (isUpToDate) {
          return 'Up to date';
        }
        return 'Available updates';
      };

      const getColor = () => {
        if (isUpToDate) {
          return 'success';
        }
        return 'warning';
      };

      return (
        <EuiFlexGroup gutterSize="none" wrap={false}>
          <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
            <EuiHealth color={getColor()}>
              <FormattedMessage
                id={`wazuhCheckUpdates.upToDateStatus.${getI18nMessageId()}`}
                defaultMessage={getDefaultMessage()}
              />
            </EuiHealth>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
            <EuiIconTip
              type="iInCircle"
              color="subdued"
              title={
                <FormattedMessage
                  id={`wazuhCheckUpdates.upToDateStatus.lastCheck`}
                  defaultMessage="Last check"
                />
              }
              content={
                item.availableUpdates.last_check
                  ? formatUIDate(new Date(item.availableUpdates.last_check))
                  : '-'
              }
              iconProps={{
                className: 'eui-alignTop',
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    },
  },
  {
    field: 'majorAvailableUpdates',
    name: 'Major available updates',
    render: (availableUpdates: APIAvailableUpdates, item: any) =>
      item.upToDate ? null : (
        <EuiFlexGroup gutterSize="m" alignItems="center">
          {item.availableUpdates.minor.map((version) => (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                {version.tag}
                <EuiIconTip
                  type="iInCircle"
                  color="subdued"
                  title={version.title}
                  content={version.description}
                  iconProps={{ className: 'eui-alignTop' }}
                />
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ),
  },
  {
    field: 'minorAvailableUpdates',
    name: 'Minor available updates',
    render: (availableUpdates: APIAvailableUpdates, item: any) =>
      item.upToDate ? null : (
        <EuiFlexGroup gutterSize="m" alignItems="center">
          {item.availableUpdates.minor.map((version) => (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                {version.tag}
                <EuiIconTip
                  type="iInCircle"
                  color="subdued"
                  title={version.title}
                  content={version.description}
                  iconProps={{ className: 'eui-alignTop' }}
                />
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ),
  },
  {
    field: 'patchAvailableUpdates',
    name: 'Patch available updates',
    render: (availableUpdates: APIAvailableUpdates, item: any) =>
      item.upToDate ? null : (
        <EuiFlexGroup gutterSize="m" alignItems="center">
          {item.availableUpdates.minor.map((version) => (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                {version.tag}
                <EuiIconTip
                  type="iInCircle"
                  color="subdued"
                  title={version.title}
                  content={version.description}
                  iconProps={{ className: 'eui-alignTop' }}
                />
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ),
  },
];
