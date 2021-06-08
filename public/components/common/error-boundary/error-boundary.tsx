/*
 * Wazuh app - React component for catch and handles rendering errors.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React, { Component } from 'react';
import loglevel from 'loglevel';
import { EuiEmptyPrompt } from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { ErrorOrchestratorClass } from '../../../react-services';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { errorTitle: null, errorInfo: null, style: null };
    this.context = this.constructor.displayName || this.constructor.name || undefined;
  }

  componentDidCatch = (errorTitle, errorInfo) => catchFunc(errorTitle, errorInfo, this);

  render() {
    const { errorTitle, style, errorInfo }: Readonly<any> = this.state;

    if (errorInfo) {
      return <HandleError errorTitle={errorTitle} errorInfo={errorInfo} style={style} />;
    }
    return this.props.children;
  }
}

const catchFunc = (errorTitle, errorInfo, ctx) => {
  try {
    ctx.setState({
      errorTitle: errorTitle,
      errorInfo: errorInfo,
    });

    const options: UIErrorLog = {
      context: ctx.context,
      level: UI_LOGGER_LEVELS.WARNING as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      display: true,
      store: true,
      error: {
        error: errorTitle.name,
        message: errorTitle.message,
        title: errorTitle.toString(),
      },
    };

    const logger = new ErrorOrchestratorClass();
    logger.handleError(options);
  } catch (error) {
    loglevel.error('Logger failed: ', error);
  }
};

const ErrorComponent = (props: { errorTitle: any; errorInfo: any; style: any }) => {
  const styles = {
    error: {
      borderTop: '1px solid #777',
      borderBottom: '1px solid #777',
      padding: '12px',
    },
  };

  return (
    <div style={props.style || styles.error}>
      <details style={{ whiteSpace: 'pre-wrap' }}>
        {props.errorTitle && props.errorTitle.toString()}
        <br />
        {props.errorInfo.componentStack}
      </details>
    </div>
  );
};

const HandleError = (props: { errorTitle: any; errorInfo: any; style: any }) => (
  <EuiEmptyPrompt
    iconType="faceSad"
    title={<h2>Something went wrong.</h2>}
    body={
      <ErrorComponent
        errorTitle={props.errorTitle}
        errorInfo={props.errorInfo}
        style={props.style}
      />
    }
  />
);
