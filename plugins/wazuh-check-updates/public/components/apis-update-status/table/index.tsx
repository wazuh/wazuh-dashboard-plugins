import { EuiInMemoryTable } from '@elastic/eui';
import React from 'react';
import { getApisUpdateStatusColumns } from './columns';
import { ApiAvailableUpdates } from '../../../../common/types';
import { I18nProvider } from '@osd/i18n/react';

export interface ApisUpdateTableProps {
  isLoading: boolean;
  apisAvailableUpdates: ApiAvailableUpdates[];
}

export const ApisUpdateTable = ({ isLoading, apisAvailableUpdates }: ApisUpdateTableProps) => {
  return (
    <I18nProvider>
      <EuiInMemoryTable
        items={apisAvailableUpdates}
        columns={getApisUpdateStatusColumns()}
        responsive
        loading={isLoading}
        tableLayout="auto"
      />
    </I18nProvider>
  );
};
