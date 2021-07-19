import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import WzReduxProvider from '../../../../redux/wz-redux-provider';


export const ModuleDrilldown = ({ toggleDrilldown, rows = [], ...props }) => {

  return <>
    <WzReduxProvider>
      <EuiFlexGroup><EuiFlexItem><EuiButtonEmpty onClick={toggleDrilldown} iconType={"sortLeft"}></EuiButtonEmpty></EuiFlexItem></EuiFlexGroup>
    </WzReduxProvider>
  </>
}