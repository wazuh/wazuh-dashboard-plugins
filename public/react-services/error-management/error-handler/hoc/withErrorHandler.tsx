import React, { ErrorInfo } from 'react';
import { ErrorHandler } from '../../error-handler';

export class ErrorHandlerComponent extends React.Component<{ children: any}> {
  componentDidCatch(error: Error, info: ErrorInfo) {
    ErrorHandler.handleError(error)
  }

  render() {
    return this.props.children;
  }
}

export const withErrorHandler = (WrappedComponent: React.ComponentType<{}>) => (props: any) => {
  return (
    <ErrorHandlerComponent>
      <WrappedComponent {...props} />
    </ErrorHandlerComponent>
  );
};
