/*
 * Wazuh app - React HOCs to manage user authorization requirements
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import log from 'loglevel';
import { EuiEmptyPrompt } from '@elastic/eui';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch = (error, errorInfo) => catchFunc(error, errorInfo, this);

  render() {
    // @ts-ignore
    if (this.state.errorInfo) {
      return <HandleError props={this} />;
    }
    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent) => (props) => (
  <ErrorBoundary>
    <WrappedComponent {...props} />
  </ErrorBoundary>
);

const catchFunc = (error, errorInfo, ctx) => {
  ctx.setState({
    error: error,
    errorInfo: errorInfo,
  });

  log.error({ error, errorInfo });
};

const ErrorComponent = (props: { ctx: any }) => {
  const styles = {
    error: {
      borderTop: '1px solid #777',
      borderBottom: '1px solid #777',
      padding: '12px',
    },
  };

  return (
    <div style={props.ctx.props.style || styles.error}>
      <details style={{ whiteSpace: 'pre-wrap' }}>
        {props.ctx.props.state.error && props.ctx.props.state.error.toString()}
        <br />
        {props.ctx.props.state.errorInfo.componentStack}
      </details>
    </div>
  );
};

const HandleError = (ctx) => (
  <EuiEmptyPrompt
    iconType="faceSad"
    title={<h2>Something went wrong.</h2>}
    body={<ErrorComponent ctx={ctx} />}
  />
);
