import React from 'react';
import { EuiPanel } from '@elastic/eui';

export const withWrapComponent =
  (WrapComponent, mapWrapComponentProps = () => {}) =>
  WrappedComponent =>
  props =>
    (
      <WrapComponent
        {...props}
        {...(mapWrapComponentProps ? mapWrapComponentProps(props) : {})}
      >
        <WrappedComponent {...props}></WrappedComponent>
      </WrapComponent>
    );

export const withPanel = optionsPanel =>
  withWrapComponent(EuiPanel, () => optionsPanel);
