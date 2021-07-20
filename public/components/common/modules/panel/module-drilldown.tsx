import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import WzReduxProvider from '../../../../redux/wz-redux-provider';


export const ModuleDrilldown = ({ toggleDrilldown, rows = [], children, ...props }) => {

  return <>
    <WzReduxProvider>
      <EuiFlexGroup><EuiFlexItem grow={false}><div><EuiButtonEmpty onClick={toggleDrilldown} iconType={"sortLeft"}></EuiButtonEmpty></div></EuiFlexItem></EuiFlexGroup>
      {children}
    </WzReduxProvider>
  </>
}