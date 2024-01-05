/*
 * Wazuh app - Health Check Component
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

import {
  EuiButton,
  EuiCallOut,
  EuiDescriptionList,
  EuiSpacer,
} from '@elastic/eui';
import React, { Fragment, useState, useEffect, useRef } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { AppState, ErrorHandler } from '../../../react-services';
import { useAppConfig, useRootScope } from '../../../components/common/hooks';
import {
  checkApiService,
  checkIndexPatternService,
  checkPatternSupportService,
  checkSetupService,
} from '../services';
import { CheckResult } from '../components/check-result';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { getCore, getHttp, getWzCurrentAppID } from '../../../kibana-services';
import {
  HEALTH_CHECK_REDIRECTION_TIME,
  NOT_TIME_FIELD_NAME_INDEX_PATTERN,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATISTICS,
  WAZUH_INDEX_TYPE_VULNERABILITIES,
  WAZUH_INDEX_TYPE_FIM,
} from '../../../../common/constants';

import { compose } from 'redux';
import { getThemeAssetURL, getAssetURL } from '../../../utils/assets';
import { serverApis } from '../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

const checks = {
  api: {
    title: 'Check Wazuh API connection',
    label: 'API connection',
    validator: checkApiService,
    awaitFor: [],
    canRetry: true,
  },
  setup: {
    title: 'Check Wazuh API version',
    label: 'API version',
    validator: checkSetupService,
    awaitFor: ['api'],
  },
  pattern: {
    title: 'Check alerts index pattern',
    label: 'Alerts index pattern',
    validator: checkIndexPatternService,
    awaitFor: [],
    shouldCheck: true,
    canRetry: true,
  },
  patternMonitoring: {
    title: 'Check monitoring index pattern',
    label: 'Monitoring index pattern',
    validator: appConfig =>
      checkPatternSupportService(
        appConfig.data['wazuh.monitoring.pattern'],
        WAZUH_INDEX_TYPE_MONITORING,
      ),
    awaitFor: [],
    shouldCheck: true,
    canRetry: true,
  },
  patternStatistics: {
    title: 'Check statistics index pattern',
    label: 'Statistics index pattern',
    validator: appConfig =>
      checkPatternSupportService(
        `${appConfig.data['cron.prefix']}-${appConfig.data['cron.statistics.index.name']}-*`,
        WAZUH_INDEX_TYPE_STATISTICS,
      ),
    awaitFor: [],
    shouldCheck: true,
    canRetry: true,
  },
  'vulnerabilities.pattern': {
    title: 'Check vulnerabilities index pattern',
    label: 'Vulnerabilities index pattern',
    validator: appConfig =>
      checkPatternSupportService(
        appConfig.data['vulnerabilities.pattern'],
        WAZUH_INDEX_TYPE_VULNERABILITIES,
        NOT_TIME_FIELD_NAME_INDEX_PATTERN,
      ),
    awaitFor: [],
    shouldCheck: false,
    canRetry: true,
  },
  'fim.pattern': {
    title: 'Check fim index pattern',
    label: 'Fim index pattern',
    validator: appConfig =>
      checkPatternSupportService(
        appConfig.data['fim.pattern'],
        WAZUH_INDEX_TYPE_FIM,
        NOT_TIME_FIELD_NAME_INDEX_PATTERN,
      ),
    awaitFor: [],
    shouldCheck: false,
    canRetry: true,
  },
};

function HealthCheckComponent() {
  const [checkWarnings, setCheckWarnings] = useState<{ [key: string]: [] }>({});
  const [checkErrors, setCheckErrors] = useState<{ [key: string]: [] }>({});
  const [checksReady, setChecksReady] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const appConfig = useAppConfig();
  const checksInitiated = useRef(false);
  const $rootScope = useRootScope();

  const redirectionPassHealthcheck = () => {
    const params = $rootScope.previousParams || {};
    const queryString = Object.keys(params)
      .map(key => key + '=' + params[key])
      .join('&');
    const url =
      `/app/${getWzCurrentAppID()}#` +
      ($rootScope.previousLocation || '') +
      '?' +
      queryString;
    window.location.href = getHttp().basePath.prepend(url);
  };

  const thereAreErrors = Object.keys(checkErrors).length > 0;
  const thereAreWarnings = Object.keys(checkWarnings).length > 0;

  useEffect(() => {
    if (appConfig.isReady && !checksInitiated.current) {
      checksInitiated.current = true;
      AppState.setPatternSelector(appConfig.data['ip.selector']);
    }
  }, [appConfig]);

  useEffect(() => {
    // Redirect to app when all checks are ready
    Object.keys(checks).every(check => checksReady[check]) &&
      !isDebugMode &&
      !thereAreWarnings &&
      (() =>
        setTimeout(
          redirectionPassHealthcheck,
          HEALTH_CHECK_REDIRECTION_TIME,
        ))();
  }, [checksReady]);

  useEffect(() => {
    // Check if Health should not redirect automatically (Debug mode)
    setIsDebugMode(window.location.href.includes('debug'));
  }, []);

  const handleWarnings = (checkID, warnings, parsed) => {
    const newWarnings = parsed
      ? warnings.map(warning =>
          ErrorHandler.handle(warning, 'Health Check', {
            warning: true,
            silent: true,
          }),
        )
      : warnings;
    setCheckWarnings(prev => ({ ...prev, [checkID]: newWarnings }));
  };

  const handleErrors = (checkID, errors, parsed) => {
    const newErrors = parsed
      ? errors.map(error =>
          ErrorHandler.handle(error, 'Health Check', {
            warning: false,
            silent: true,
          }),
        )
      : errors;
    setCheckErrors(prev => ({ ...prev, [checkID]: newErrors }));
  };

  const cleanWarnings = (checkID: string) => {
    delete checkWarnings[checkID];
    setCheckWarnings({ ...checkWarnings });
  };

  const cleanErrors = (checkID: string) => {
    delete checkErrors[checkID];
    setCheckErrors({ ...checkErrors });
  };

  const handleCheckReady = (checkID, isReady) => {
    setChecksReady(prev => ({ ...prev, [checkID]: isReady }));
  };

  const logoUrl = getHttp().basePath.prepend(
    appConfig.data['customization.enabled'] &&
      appConfig.data['customization.logo.healthcheck']
      ? getAssetURL(appConfig.data['customization.logo.healthcheck'])
      : getThemeAssetURL('logo.svg'),
  );

  const renderChecks = () => {
    const showLogButton = thereAreErrors || thereAreWarnings || isDebugMode;
    return Object.keys(checks).map((check, index) => {
      return (
        <CheckResult
          showLogButton={showLogButton}
          key={`health_check_check_${check}`}
          name={check}
          title={checks[check].title}
          awaitFor={checks[check].awaitFor}
          shouldCheck={
            checks[check].shouldCheck || appConfig.data[`checks.${check}`]
          }
          validationService={checks[check].validator(appConfig)}
          handleWarnings={handleWarnings}
          handleErrors={handleErrors}
          cleanWarnings={cleanWarnings}
          cleanErrors={cleanErrors}
          isLoading={appConfig.isLoading}
          handleCheckReady={handleCheckReady}
          checksReady={checksReady}
          canRetry={checks[check].canRetry}
        />
      );
    });
  };

  const addTagsToUrl = error => {
    const words = error.split(' ');
    words.forEach((word, index) => {
      if (word.includes('http://') || word.includes('https://')) {
        if (words[index - 1] === 'guide:') {
          if (word.endsWith('.') || word.endsWith(',')) {
            words[index - 2] = `<a href="${word.slice(
              0,
              -1,
            )}" rel="noopener noreferrer" target="_blank">${
              words[index - 2]
            } ${words[index - 1].slice(0, -1)}</a>${word.slice(-1)}`;
          } else {
            words[
              index - 2
            ] = `<a href="${word}" rel="noopener noreferrer" target="_blank">${
              words[index - 2]
            } ${words[index - 1].slice(0, -1)}</a> `;
          }
          words.splice(index - 1, 2);
        } else {
          if (word.endsWith('.') || word.endsWith(',')) {
            words[index] = `<a href="${word.slice(
              0,
              -1,
            )}" rel="noopener noreferrer" target="_blank">${word.slice(
              0,
              -1,
            )}</a>${word.slice(-1)}`;
          } else {
            words[
              index
            ] = `<a href="${word}" rel="noopener noreferrer" target="_blank">${word}</a>`;
          }
        }
      }
    });
    return words.join(' ');
  };

  const renderWarnings = () => {
    return Object.keys(checkWarnings).map(checkID =>
      checkWarnings[checkID].map((warning, index) => (
        <Fragment key={index}>
          <EuiCallOut
            title={
              <>
                {`[${checks[checkID].label}]`}{' '}
                <span
                  dangerouslySetInnerHTML={{ __html: addTagsToUrl(warning) }}
                ></span>
              </>
            }
            color='warning'
            iconType='alert'
            style={{ textAlign: 'left' }}
            data-test-subj='callOutWarning'
          ></EuiCallOut>
          <EuiSpacer size='xs' />
        </Fragment>
      )),
    );
  };

  const renderErrors = () => {
    return Object.keys(checkErrors).map(checkID =>
      checkErrors[checkID].map((error, index) => (
        <Fragment key={index}>
          <EuiCallOut
            title={
              <>
                {`[${checks[checkID].label}]`}{' '}
                <span
                  dangerouslySetInnerHTML={{ __html: addTagsToUrl(error) }}
                ></span>
              </>
            }
            color='danger'
            iconType='alert'
            style={{ textAlign: 'left' }}
            data-test-subj='callOutError'
          ></EuiCallOut>
          <EuiSpacer size='xs' />
        </Fragment>
      )),
    );
  };

  return (
    <div className='health-check'>
      <img src={logoUrl} className='health-check-logo' alt=''></img>
      <div className='margin-top-30'>
        <EuiDescriptionList textStyle='reverse' align='center' type='column'>
          {renderChecks()}
        </EuiDescriptionList>
      </div>
      {thereAreErrors && (
        <>
          <EuiSpacer size='xl' />
          {renderErrors()}
        </>
      )}
      {thereAreWarnings && (
        <>
          <EuiSpacer size='xl' />
          {renderWarnings()}
        </>
      )}
      {(thereAreErrors || thereAreWarnings || isDebugMode) && (
        <>
          <EuiSpacer size='xl' />
          <EuiFlexGroup justifyContent='center'>
            {thereAreErrors && (
              <EuiFlexItem grow={false}>
                <RedirectAppLinks application={getCore().application}>
                  <EuiButton
                    fill
                    href={getCore().application.getUrlForApp(serverApis.id)}
                  >
                    Go to Settings
                  </EuiButton>
                </RedirectAppLinks>
              </EuiFlexItem>
            )}
            {(isDebugMode || thereAreWarnings) &&
              Object.keys(checks).every(check => checksReady[check]) && (
                <EuiFlexItem grow={false}>
                  <EuiButton fill onClick={redirectionPassHealthcheck}>
                    Continue
                  </EuiButton>
                </EuiFlexItem>
              )}
          </EuiFlexGroup>
        </>
      )}
      <EuiSpacer size='xl' />
    </div>
  );
}

export const HealthCheck = compose(
  withErrorBoundary,
  withReduxProvider,
)(HealthCheckComponent);

export const HealthCheckTest = HealthCheckComponent;
