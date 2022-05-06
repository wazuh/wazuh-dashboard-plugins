/*
 * Wazuh app - React component for catch and handles rendering errors.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { ErrorComponentPrompt } from '../error-boundary-prompt/error-boundary-prompt';
import { getErrorOrchestrator } from '../../../react-services/common-services';

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
      return <ErrorComponentPrompt errorTitle={errorTitle} errorInfo={errorInfo} style={style} />;
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
      context: errorInfo.componentStack,
      level: UI_LOGGER_LEVELS.WARNING as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      display: false,
      store: true,
      error: {
        error: errorTitle.name,
        message: errorTitle.message,
        title: errorTitle.toString(),
      },
    };

    getErrorOrchestrator().handleError(options);
  } catch (error) {
    const optionsCatch: UIErrorLog = {
      context: ctx.context,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      display: false,
      store: true,
      error: {
        error: error,
        message: error?.message || '',
        title: '',
      },
    };

    getErrorOrchestrator().handleError(optionsCatch);
  }
};
