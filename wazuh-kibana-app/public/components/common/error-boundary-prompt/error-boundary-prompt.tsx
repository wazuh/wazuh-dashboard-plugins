/*
 * Wazuh app - React Prompt handles rendering errors.
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

import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import './error-boundary-prompt.scss';

export const ErrorComponentPrompt = (props: {
  errorTitle: any;
  errorInfo?: any;
  style?: any;
  action?: React.ReactNode;
}) => {
  const styles = {
    error: {
      borderTop: '1px solid #777',
      borderBottom: '1px solid #777',
      padding: '12px',
    },
  };

  return (
    <EuiEmptyPrompt
      iconType="faceSad"
      title={<h2>Something went wrong.</h2>}
      body={
        <div style={props.style || styles.error}>
          <details className="wz-error-boundary__details">
            <span>{props.errorTitle && props.errorTitle.toString()}</span>
            <br />
            <span>{props.errorInfo?.componentStack || ''}</span>
          </details>
        </div>
      }
      actions={props.action || null}
    />
  );
};
