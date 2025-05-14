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
  withWrapComponent(
    ({
      paddingSize,
      hasShadow,
      hasBorder,
      borderRadius,
      grow,
      panelRef,
      color,
      className,
      'aria-label': ariaLabel,
      'data-test-subj': dataTestSubject,
      children,
    }) => {
      const panelProps = {
        paddingSize,
        hasShadow,
        hasBorder,
        borderRadius,
        grow,
        panelRef,
        color,
        className,
        'aria-label': ariaLabel,
        'data-test-subj': dataTestSubject,
        children,
      };
      return <EuiPanel {...panelProps}>{children}</EuiPanel>;
    },
    () => optionsPanel,
  );
