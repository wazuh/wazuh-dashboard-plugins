import React from 'react';
import {
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import {MetadataForm} from './metadata-form'

export const FlyoutForm = ({title="", closeFlyout=()=>{},children})=>(
<EuiFlyout size="s" type="push" onClose={closeFlyout}>
  <EuiFlyoutHeader hasBorder >
    <EuiTitle>
      <h2 >{title}</h2>
    </EuiTitle>
  </EuiFlyoutHeader>
  <EuiFlyoutBody>
    <MetadataForm/>
  </EuiFlyoutBody>
  <EuiFlyoutFooter>
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>cosas</EuiFlexItem>

    </EuiFlexGroup>
  </EuiFlyoutFooter>
</EuiFlyout>)
