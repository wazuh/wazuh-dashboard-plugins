import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';

export const FleetList = () => {
  return (
    <I18nProvider>
      <EuiPanel>Fleet list</EuiPanel>
    </I18nProvider>
  );
};
