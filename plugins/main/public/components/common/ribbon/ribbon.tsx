import React from 'react';
import { EuiFlexGroup, EuiPanel } from '@elastic/eui';
import WzRibbonItem, { type IRibbonItem } from './ribbon-item';

interface RibbonProps {
  items: Array<IRibbonItem>;
  'data-test-subj'?: string;
}

const WzRibbon = (props: RibbonProps) => {
  const { items, 'data-test-subj': dataTestSubj } = props;
  return (
    <EuiPanel paddingSize='s'>
      <EuiFlexGroup
        data-test-subj={dataTestSubj}
        wrap
        style={{ responsive: true }}
      >
        {items.map(item => (
          <WzRibbonItem key={item.key} item={item} />
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export default WzRibbon;
