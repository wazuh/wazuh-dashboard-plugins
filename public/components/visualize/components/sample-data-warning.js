/*
 * Wazuh app - React component for Visualize - Sample Data.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import React, { useState, useEffect } from 'react';
import { WzRequest } from '../../../react-services';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const SampleDataWarning = ({ ...props }) => {
  const [isSampleData, setIsSampleData] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = (await WzRequest.genericReq('GET', '/elastic/samplealerts')).data
          .sampleAlertsInstalled;
        setIsSampleData(result);
      } catch (error) {
        const options = {
          context: `${SampleDataWarning.name}.usesSampleData`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.UI,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    })();
  }, [
    SampleDataWarning,
    setIsSampleData,
    UI_ERROR_SEVERITIES,
    UI_LOGGER_LEVELS,
    getErrorOrchestrator,
    WzRequest,
  ]);
  if (isSampleData) {
    return (
      <EuiCallOut
        title="This dashboard contains sample data"
        color="warning"
        iconType="alert"
        style={{ margin: '0 8px 16px 8px' }}
        data-test-subject="sample-data-callout"
        {...props}
      >
        <p>
          {'The data displayed may contain sample alerts. Go '}
          <EuiLink href="#/settings?tab=sample_data" aria-label="go to configure sample data">
            {'here '}
          </EuiLink>
          {'to configure the sample data.'}
        </p>
      </EuiCallOut>
    );
  } else {
    return null;
  }
};
