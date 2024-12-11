import React from 'react';
import { EuiFlexGroup, EuiPanel } from '@elastic/eui';
import WzRibbonItem, { type IRibbonItem } from './ribbon-item';
import './ribbon.scss';

interface RibbonProps {
  items: Array<IRibbonItem>;
  'data-test-subj'?: string;
}

const WzRibbon = (props: RibbonProps) => {
  const { items, 'data-test-subj': dataTestSubj } = props;

  const condensedItems = items.filter(item => item.condensed);
  const nonCondensedItems = items.filter(item => !item.condensed);

  return (
    <EuiPanel paddingSize='m'>
      <EuiFlexGroup
        data-test-subj={dataTestSubj}
        wrap
        justifyContent='spaceBetween'
        style={{ responsive: true }}
      >
        <EuiFlexGroup gutterSize='l' className='wz-ribbon-condensed'>
          {condensedItems.map(item => (
            <WzRibbonItem key={item.key} item={item} />
          ))}
        </EuiFlexGroup>
        {nonCondensedItems.map(item => (
          <WzRibbonItem key={item.key} item={item} />
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export default WzRibbon;
