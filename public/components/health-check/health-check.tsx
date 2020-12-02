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
import { ErrorHandler } from '../../react-services/error-handler';
import React from 'react';
import { useState, useEffect } from 'react';
import { useAppConfig } from '../../hooks/use-app-config';
import {
  checkPatternService,
  checkTemplateService,
  checkApiService,
  checkSetupService,
  checkFieldsService,
  checkKibanaSettings,
  checkKibanaSettingsTimeFilter,
} from './services';
import { CheckResult } from './components/check-result';
import AppState from '../../react-services/app-state';
import { useAppDeps } from '../../hooks/use-app-deps';
import { useToasts } from '../../hooks/use-toasts';


const checks = {
  api: {
    title: 'Check Wazuh API connection',
    validator: checkApiService,
  },
  setup: {
    title: 'Check for Wazuh API version',
    validator: checkSetupService,
  },
  pattern: {
    title: 'Check Elasticsearch index pattern',
    validator: checkPatternService,
  },
  template: {
    title: 'Check Elasticsearch template',
    validator: checkTemplateService,
  },
  fields: {
    title: 'Check index pattern fields',
    validator: checkFieldsService,
  },
};

export function HealthCheck(props) {
  const [checkResults, setCheckResults] = useState<any[]>([]);
  const [checkErrors, setCheckErrors] = useState<any[]>([]);
  const { core } = useAppDeps();
  const toasts = useToasts();
  const appConfig = useAppConfig();


  useEffect(() => {
    if (!appConfig.isReady) {
      setCheckResults(
        Object.keys(checks).map((check) => {
          return (
            <CheckResult
              title={checks[check].title}
              check={appConfig.data[`checks.${check}`]}
              validationService={checks[check].validator}
              handleError={handleError}
              showToast={showToast}
            />
          );
        })
      );
      checkKibanaSettings(appConfig.data['checks.metaFields']);
      checkKibanaSettingsTimeFilter(appConfig.data['checks.timeFilter']);
      AppState.setPatternSelector(appConfig.data['ip.selector']);
    }
  }, [appConfig]);

  const handleError = (errors, parsed) => {
    let _errors = checkErrors;
    _errors.push(
      ...(parsed
        ? errors.map((error) => ErrorHandler.handle(error, 'Health Check', { silent: true }))
        : errors)
    );
    setCheckErrors(_errors);
  };

  const showToast = (color, title, text, time) => {
    toasts.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  const logo_url = core.http.basePath.prepend('/plugins/wazuh/img/icon_blue.svg');
  return (
    <div className="health-check">
      <EuiLoadingSpinner className="health-check-loader" />
      <img src={logo_url} className="health-check-logo" alt=""></img>
      <div className="margin-top-30">
        <EuiDescriptionList textStyle="reverse" align="center" type="column">
          {checkResults}
        </EuiDescriptionList>
      </div>
      <EuiSpacer size="xxl" />
      {(checkErrors || []).map((error) => (
        <>
          <EuiCallOut
            title={error}
            color="danger"
            iconType="alert"
            style={{ textAlign: 'left' }}
          ></EuiCallOut>
          <EuiSpacer size="xs" />
        </>
      ))}
      <EuiSpacer size="xxl" />
      {!!checkErrors.length && (
        <EuiButton fill href="/settings">
          Go to App
        </EuiButton>
      )}
    </div>
  );
}
