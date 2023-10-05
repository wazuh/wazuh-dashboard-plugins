import { EuiInMemoryTable } from '@elastic/eui';
import React from 'react';
import { getApisUpdateStatusColumns } from './columns';
import { ApiAvailableUpdates } from '../../../../common/types';

export interface ApisUpdateTableProps {
  isLoading: boolean;
  apisAvailableUpdates: ApiAvailableUpdates[];
}

export const ApisUpdateTable = ({ isLoading, apisAvailableUpdates }: ApisUpdateTableProps) => {
  return (
    <EuiInMemoryTable
      items={apisAvailableUpdates}
      columns={getApisUpdateStatusColumns()}
      responsive
      loading={isLoading}
      tableLayout="auto"
    />
  );
};
