import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTitle, EuiPanel } from '@elastic/eui';
import WzRibbonItem, { type IRibbonItem } from './ribbon-item';
import './ribbon.scss';

interface RibbonProps {
  items: Array<IRibbonItem>;
  'data-test-subj'?: string;
  title?: string;
}

const WzRibbon = (props: RibbonProps) => {
  const { items, 'data-test-subj': dataTestSubj, title } = props;

  const condensedItems = items.filter(item => item.condensed);
  const nonCondensedItems = items.filter(item => !item.condensed);

  return (
    <EuiPanel paddingSize='m'>
      {title ? (
        typeof title === 'string' ? (
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <h2>{title}</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          title
        )
      ) : null}
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
