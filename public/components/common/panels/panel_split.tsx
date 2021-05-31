
import React from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export const PanelSplit = ({side, sideColor='#80808014', content, panelProps = {}, sideProps = {}, contentProps = {}}) => {
  const {style: sidePropsSytle, ...restSideProps} = sideProps;
  const {style: contentPropsSytle, ...restContentProps} = contentProps;
  return (
    <EuiPanel paddingSize="none" {...panelProps}>
      <EuiFlexGroup style={{margin: 0}}>
        <EuiFlexItem grow={false} style={{backgroundColor: sideColor, margin: 0, padding: '10px 10px 0 10px',...(sidePropsSytle || {})}}{...restSideProps}>
          {side}
        </EuiFlexItem>
        <EuiFlexItem style={{padding: 10,...(contentPropsSytle || {})}} {...restContentProps}>
          {content}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  )
}
