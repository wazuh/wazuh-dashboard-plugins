import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import WzReduxProvider from '../../../../redux/wz-redux-provider';


export const ModuleDrilldown = ({ rows = [], ...props }) => {

  return <>
    <WzReduxProvider>
      {
        rows.map((row, key) => {
          return <EuiFlexGroup key={key} style={{
            height: row.height || (150 + 'px')
          }}>{
              row.columns.map((column, key) => {
                const growthFactor = Math.max((column.width ? parseInt(column.width / 10) : 1), 1);
                const visProps = { ...(column.props || {}) };
                return <EuiFlexItem key={key} grow={growthFactor}>
                  <column.component {...visProps} />
                </EuiFlexItem>
              })
            }</EuiFlexGroup>
        })
      }
    </WzReduxProvider>
  </>
}