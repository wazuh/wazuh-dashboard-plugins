import React from 'react';
import { EuiFlexGroup } from '@elastic/eui';
import RibbonItem, { type IRibbonItem } from './ribbon-item';

interface RibbonProps {
  items: Array<IRibbonItem>;
  'data-test-subj'?: string;
}

const Ribbon = (props: RibbonProps) => {
  const { items, 'data-test-subj': dataTestSubj } = props;
  return (
    <EuiFlexGroup
      data-test-subj={dataTestSubj}
      wrap
      style={{ responsive: true }}
    >
      {items.map(item => (
        <RibbonItem item={item} />
      ))}
    </EuiFlexGroup>
  );
};

export default Ribbon;
