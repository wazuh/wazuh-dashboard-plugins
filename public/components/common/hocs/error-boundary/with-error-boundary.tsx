import React, { Component } from 'react';
import log from 'loglevel';
import { EuiEmptyPrompt } from '@elastic/eui';
import { loggerService } from '../../../../../common/utils/logger/logger';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch = (error, errorInfo) => catchFunc(error, errorInfo, this);

  render() {
    // @ts-ignore
    if (this.state.errorInfo) {
      return handleError(this);
    }
    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent) =>
  class extends Component {
    constructor(props) {
      super(props);
      this.state = { error: null, errorInfo: null };
    }

    componentDidCatch = (error, errorInfo) => {
      catchFunc(error, errorInfo, this);
    };

    render() {
      debugger;
      // @ts-ignore
      if (this.state.errorInfo) {
        return handleError(this);
      }
      return <WrappedComponent {...this.props} />;
    }
  };

const catchFunc = (error, errorInfo, ctx) => {
  ctx.setState({
    error: error,
    errorInfo: errorInfo,
  });

  loggerService.error('Error in HOC', {
    level: 'ERROR',
    criticality: 'UI',
    log: true,
    error: new Error('hoc error'),
    context: 'error-boundary-context'
  });
};

const ErrorComponent = (props: { ctx: any }) => {
  return (
    <div style={props.ctx.props.style || styles.error}>
      <details style={{ whiteSpace: 'pre-wrap' }}>
        {props.ctx.state.error && props.ctx.state.error.toString()}
        <br />
        {props.ctx.state.errorInfo.componentStack}
      </details>
    </div>
  );
};

const handleError = (ctx) => (
  <EuiEmptyPrompt
    iconType="faceSad"
    title={<h2>Something went wrong.</h2>}
    body={<ErrorComponent ctx={ctx} />}
  />
);

const styles = {
  error: {
    borderTop: '1px solid #777',
    borderBottom: '1px solid #777',
    padding: '12px',
  },
};
