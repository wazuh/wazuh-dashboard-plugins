import { EuiInMemoryTable } from '@elastic/eui';
import React from 'react';
import { getApisUpdateStatusColumns } from './columns';
import { ApiAvailableUpdates } from '../../../../common/types';

export interface ApisUpdateTableProps {
  isLoading: boolean;
  apiAvailableUpdates: ApiAvailableUpdates[];
}

export const ApisUpdateTable = ({ isLoading, apiAvailableUpdates }: ApisUpdateTableProps) => {
  return (
    <EuiInMemoryTable
      items={apiAvailableUpdates}
      columns={getApisUpdateStatusColumns()}
      responsive
      loading={isLoading}
      tableLayout="auto"
    />
  );
};
