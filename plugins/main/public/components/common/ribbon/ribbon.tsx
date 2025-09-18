import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTitle, EuiPanel } from '@elastic/eui';
import WzRibbonItem, { type IRibbonItem } from './ribbon-item';
import './ribbon.scss';

export interface IWzRibbonBody {
  items: Array<IRibbonItem>;
  'data-test-subj'?: string;
}

export interface IRibbonTitle {
  title?: string | React.ReactNode;
}

export type IRibbonProps = IWzRibbonBody & IRibbonTitle;

const WzRibbon = (props: IRibbonProps) => {
  const { items, 'data-test-subj': dataTestSubj, title } = props;

  return (
    <WzRibbonPanel>
      <WzRibbonTitle title={title} />
      <WzRibbonBody dataTestSubj={dataTestSubj} items={items} />
    </WzRibbonPanel>
  );
};

export const WzRibbonPanel = ({ children }: { children: React.ReactNode }) => (
  <EuiPanel paddingSize='m'>{children}</EuiPanel>
);

export const WzRibbonTitle = ({ title }: { title: React.ReactNode }) =>
  title ? (
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
  ) : null;

export const WzRibbonBody = ({
  'data-test-subj': dataTestSubj,
  items,
}: IWzRibbonBody) => {
  const condensedItems = items.filter(item => item.condensed);
  const nonCondensedItems = items.filter(item => !item.condensed);

  return (
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
  );
};

export default WzRibbon;
