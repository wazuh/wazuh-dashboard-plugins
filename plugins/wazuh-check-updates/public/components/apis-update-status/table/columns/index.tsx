import React from 'react';
import { EuiHealth } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ApiAvailableUpdates, API_UPDATES_STATUS, Update } from '../../../../../common/types';
import { UpdateBadge } from './update-badge';

export const getApisUpdateStatusColumns = () => {
  const API_UPDATES_STATUS_COLUMN = {
    [API_UPDATES_STATUS.UP_TO_DATE]: {
      defaultMessage: 'Up to date',
      color: 'success',
    },
    [API_UPDATES_STATUS.AVAILABLE_UPDATES]: {
      defaultMessage: 'Available updates',
      color: 'warning',
    },
    [API_UPDATES_STATUS.DISABLED]: {
      defaultMessage: 'Checking updates disabled',
      color: 'subdued',
    },
    [API_UPDATES_STATUS.ERROR]: {
      defaultMessage: 'Error checking updates',
      color: 'danger',
    },
  };

  const baseColumns = [
    {
      field: 'api_id',
      name: 'ID',
      width: '100px',
    },
    {
      field: 'current_version',
      name: 'Version',
      width: '100px',
    },
    {
      field: 'status',
      name: 'Update status',
      width: '200px',
      render: (status: API_UPDATES_STATUS, api: ApiAvailableUpdates) => {
        const getDefaultMessage = () => {
          return API_UPDATES_STATUS_COLUMN[status]?.defaultMessage || 'Error checking updates';
        };

        const getColor = () => {
          return API_UPDATES_STATUS_COLUMN[status]?.color || 'danger';
        };

        return (
          <EuiHealth color={getColor()}>
            <FormattedMessage
              id={`wazuhCheckUpdates.upToDateStatus.${status}`}
              defaultMessage={getDefaultMessage()}
            />
          </EuiHealth>
        );
      },
    },
  ];

  const updatesColumn = (field: string, name: string) => ({
    field,
    name,
    width: '200px',
    render: (lastUpdate: Update, api: ApiAvailableUpdates) =>
      api.status !== API_UPDATES_STATUS.ERROR && lastUpdate ? (
        <UpdateBadge update={lastUpdate} />
      ) : null,
  });

  const finalColumns = [
    ...baseColumns,
    updatesColumn('last_available_major', 'Last major'),
    updatesColumn('last_available_minor', 'Last minor'),
    updatesColumn('last_available_patch', 'Last patch'),
  ];

  return finalColumns;
};
