import React from 'react';
import { EuiTab, EuiTabs } from '@elastic/eui';

const DevToolTabs = () => {
  return (
    <EuiTabs size='s'>
      <EuiTab isSelected={true}>Console</EuiTab>
    </EuiTabs>
  );
};

export default DevToolTabs;
