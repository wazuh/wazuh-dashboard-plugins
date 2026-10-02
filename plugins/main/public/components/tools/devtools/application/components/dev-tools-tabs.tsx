import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiTab, EuiTabs } from '@elastic/eui';

const DevToolTabs = () => {
  return (
    <EuiTabs size='s'>
      <EuiTab isSelected={true}>
        {i18n.translate('wazuh.devTools.tabs.console', {
          defaultMessage: 'Console',
        })}
      </EuiTab>
    </EuiTabs>
  );
};

export default DevToolTabs;
