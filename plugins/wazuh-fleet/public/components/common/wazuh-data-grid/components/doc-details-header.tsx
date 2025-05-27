import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';

const DocDetailsHeader = () => (
  <EuiFlexGroup>
    <EuiFlexItem>
      <EuiTitle>
        <h2>Document Details</h2>
      </EuiTitle>
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiFlexGroup>
        <EuiFlexItem></EuiFlexItem>
        <EuiFlexItem></EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default DocDetailsHeader;
