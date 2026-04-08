import React from 'react';
import { EuiTab, EuiTabs } from '@elastic/eui';
import { i18n } from '@osd/i18n';

const DevToolTabs = () => {
  return (
    <EuiTabs size='s'>
      <EuiTab isSelected={true}>{i18n.translate('wazuh.tools.devtools.console', {
        defaultMessage: 'Console'
      })}</EuiTab>
    </EuiTabs>
  );
};

export default DevToolTabs;
