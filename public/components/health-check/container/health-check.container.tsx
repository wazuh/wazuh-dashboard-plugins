/*
 * Wazuh app - Health Check Component
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import {
  EuiButton,
  EuiCallOut,
  EuiDescriptionList,
  EuiLoadingSpinner,
  EuiSpacer,
} from '@elastic/eui';
import ErrorHandler from '../../../react-services/error-handler';
import React from 'react';
import { useState, useEffect } from 'react';
import { useAppConfig } from '../../../components/common/hooks/use-app-config';
import {
  checkPatternService,
  checkTemplateService,
  checkApiService,
  checkSetupService,
  checkFieldsService,
  checkKibanaSettings,
  checkKibanaSettingsTimeFilter,
} from '../services';
import { CheckResult } from '../components/check-result';
import AppState from '../../../react-services/app-state';
import { useAppDeps } from '../../../components/common/hooks/use-app-deps';
import { Fragment } from 'react';

const checks = {
  api: {    
    title: 'Check Wazuh API connection',
    validator: checkApiService,
    awaitFor: []
  },
  setup: {
    title: 'Check for Wazuh API version',
    validator: checkSetupService,
    awaitFor: ["api"],
  },
  pattern: {
    title: 'Check Elasticsearch index pattern',
    validator: checkPatternService,
    awaitFor: []
  },
  template: {
    title: 'Check Elasticsearch template',
    validator: checkTemplateService,
    awaitFor: ["pattern"],
  },
  fields: {
    title: 'Check index pattern fields',
    validator: checkFieldsService,
    awaitFor: ["pattern"],
  },
};

export function HealthCheck() {
  const [checkErrors, setCheckErrors] = useState<any[]>([]);
  const [checksReady, setChecksReady] = useState<{[key: string]: boolean}>({});
  const { core } = useAppDeps();
  const appConfig = useAppConfig();

  useEffect(() => {
    if (appConfig.isReady) {
      checkKibanaSettings(appConfig.data['checks.metaFields']);
      checkKibanaSettingsTimeFilter(appConfig.data['checks.timeFilter']);
      AppState.setPatternSelector(appConfig.data['ip.selector']);
    }
  }, [appConfig]);

  const handleErrors = (errors, parsed) => {
    const newErrors = parsed
      ? errors.map((error) =>
          ErrorHandler.handle(error, 'Health Check', { warning: false, silent: true })
        )
      : errors;
    setCheckErrors((prev) => [...prev, ...newErrors]);
  };

  const handleCheckReady = (checkId, isReady) => {    
    setChecksReady(prev =>  ({...prev, [checkId]: isReady}));
  }

  const renderChecks = () => {
    return Object.keys(checks).map((check, index) => {
      return (
        <CheckResult
          key={index}          
          name={check}
          title={checks[check].title}
          awaitFor={checks[check].awaitFor}
          check={appConfig.data[`checks.${check}`]}
          validationService={checks[check].validator}
          handleErrors={handleErrors}
          isLoading={appConfig.isLoading}
          handleCheckReady= {handleCheckReady}
          checksReady={checksReady}
        />
      );
    });
  };

  const renderErrors = () => {
    return checkErrors.map((error, index) => {
      return (
        <Fragment key={index}>
          <EuiCallOut
            title={error}
            color="danger"
            iconType="alert"
            style={{ textAlign: 'left' }}
          ></EuiCallOut>
          <EuiSpacer size="xs" />
        </Fragment>
      );
    });
  };

  const logo_url = core.http.basePath.prepend('/plugins/wazuh/assets/icon_blue.svg');
  return (
    <div className="health-check">
      <EuiLoadingSpinner className="health-check-loader" />
      <img src={logo_url} className="health-check-logo" alt=""></img>
      <div className="margin-top-30">
        <EuiDescriptionList textStyle="reverse" align="center" type="column">
          {renderChecks()}
        </EuiDescriptionList>
      </div>
      <EuiSpacer size="xxl" />
      {renderErrors()}
      <EuiSpacer size="xxl" />
      {!!checkErrors.length && (
        <EuiButton fill href="/settings">
          Go to App
        </EuiButton>
      )}
    </div>
  );
}
