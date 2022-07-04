import React, { ErrorInfo } from 'react';

export class ErrorHandlerComponent extends React.Component {
  componentDidCatch(error: Error, info: ErrorInfo) {
    //console.log('error', error, info);
  }

  render() {
    return this.props.children;
  }
}

export const withErrorHandler = (WrappedComponent) => (props) => {
  return (
    <ErrorHandlerComponent>
      <WrappedComponent {...props} />
    </ErrorHandlerComponent>
  );
};
