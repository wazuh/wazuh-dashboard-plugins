import React, { ErrorInfo } from 'react';
import { ErrorComponentPrompt } from '../../../../components/common/error-boundary-prompt/error-boundary-prompt';
import { ErrorHandler } from '../../error-handler';

interface iErrorHandlerComponentState {
  error?: Error | null;
  hasError: boolean;
  errorInfo?: ErrorInfo | null;
}
export class ErrorHandlerComponent extends React.Component<
  { children: any },
  iErrorHandlerComponentState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null  };
  }

  componentDidCatch(error: Error, info?: ErrorInfo) {
    const errorCreated = ErrorHandler.handleError(error);
    this.setState({ hasError: true, error: errorCreated, errorInfo: info });
  }

  /**
   * Update state so the next render will show the fallback UI.
   * @param error
   * @returns
   */
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      return (
        <ErrorComponentPrompt
          errorTitle={error?.message}
          errorInfo={errorInfo || error?.stack}
        />
      );
    }
    return this.props.children;
  }
}

export const withErrorHandler =
  (WrappedComponent: React.ComponentType<any>) => (props: any) => {
    return (
      <ErrorHandlerComponent>
        <WrappedComponent {...props} />
      </ErrorHandlerComponent>
    );
  };
