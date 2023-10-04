import React from 'react';
import { EuiHealth } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ApiAvailableUpdates, API_UPDATES_STATUS, Update } from '../../../../../common/types';
import { UpdateBadge } from './update-badge';

export const getApisUpdateStatusColumns = () => {
  const baseColumns = [
    {
      field: 'apiId',
      name: 'ID',
      width: '100px',
    },
    {
      field: 'version',
      name: 'Version',
      width: '100px',
    },
    {
      field: 'status',
      name: 'Update status',
      width: '200px',
      render: (status: API_UPDATES_STATUS, api: ApiAvailableUpdates) => {
        const getDefaultMessage = () => {
          if (status === API_UPDATES_STATUS.UP_TO_DATE) {
            return 'Up to date';
          }
          if (status === API_UPDATES_STATUS.AVAILABLE_UPDATES) {
            return 'Available updates';
          }
          return 'Error checking updates';
        };

        const getColor = () => {
          if (status === API_UPDATES_STATUS.UP_TO_DATE) {
            return 'success';
          }
          if (status === API_UPDATES_STATUS.AVAILABLE_UPDATES) {
            return 'warning';
          }
          return 'danger';
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
    updatesColumn('lastMayor', 'Last major'),
    updatesColumn('lastMinor', 'Last minor'),
    updatesColumn('lastPatch', 'Last patch'),
  ];

  return finalColumns;
};
