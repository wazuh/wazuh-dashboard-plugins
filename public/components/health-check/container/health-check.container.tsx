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
import {
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui';
import { AppState, ErrorHandler } from '../../../react-services';
import { useAppConfig, useRootScope } from '../../../components/common/hooks';
import {
  checkApiService,
  checkPluginPlatformSettings,
  checkIndexPatternService,
  checkPatternSupportService,
  checkSetupService,
} from '../services';
import { CheckResult } from '../components/check-result';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { getHttp } from '../../../kibana-services';
import {
  HEALTH_CHECK_REDIRECTION_TIME,
  PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
  PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
  PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATISTICS,
  WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
  WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
  WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER,
} from '../../../../common/constants';

import { getDataPlugin } from '../../../kibana-services';
import { CheckLogger } from '../types/check_logger';
import { compose } from 'redux';
import { getThemeAssetURL, getAssetURL } from '../../../utils/assets';

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
    awaitFor: ["api"],
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
    validator: (appConfig) => checkPatternSupportService(appConfig.data['wazuh.monitoring.pattern'], WAZUH_INDEX_TYPE_MONITORING),
    awaitFor: [],
    shouldCheck: true,
    canRetry: true,
  },
  patternStatistics: {
    title: 'Check statistics index pattern',
    label: 'Statistics index pattern',
    validator: (appConfig) => checkPatternSupportService(`${appConfig.data['cron.prefix']}-${appConfig.data['cron.statistics.index.name']}-*`, WAZUH_INDEX_TYPE_STATISTICS),
    awaitFor: [],
    shouldCheck: true,
    canRetry: true,
  },
  maxBuckets: {
    title: `Check ${PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS} setting`,
    label: `${PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS} setting`,
    validator: checkPluginPlatformSettings(PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS, WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS),
    awaitFor: [],
    canRetry: true,
  },
  metaFields: {
    title: `Check ${PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS} setting`,
    label: `${PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS} setting`,
    validator: checkPluginPlatformSettings(PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS, WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS),
    awaitFor: [],
    canRetry: true,
  },
  timeFilter: {
    title: `Check ${PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER} setting`,
    label: `${PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER} setting`,
    validator: checkPluginPlatformSettings(
      PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
      JSON.stringify(WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER),
      (checkLogger: CheckLogger, options: { defaultAppValue: any }) => {
        getDataPlugin().query.timefilter.timefilter.setTime(WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER)
          && checkLogger.action(`Timefilter set to ${JSON.stringify(options.defaultAppValue)}`);
      }),
    awaitFor: [],
    canRetry: true,
  }
};

function HealthCheckComponent() {
  const [checkErrors, setCheckErrors] = useState<{ [key: string]: [] }>({});
  const [checksReady, setChecksReady] = useState<{ [key: string]: boolean }>({});
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const appConfig = useAppConfig();
  const checksInitiated = useRef(false);
  const $rootScope = useRootScope();

  const redirectionPassHealthcheck = () => {
    const params = $rootScope.previousParams || {};
    const queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
    const url = '/app/wazuh#' + ($rootScope.previousLocation || '') + '?' + queryString;
    window.location.href = getHttp().basePath.prepend(url);
  };

  useEffect(() => {
    if (appConfig.isReady && !checksInitiated.current) {
      checksInitiated.current = true;
      AppState.setPatternSelector(appConfig.data['ip.selector']);
    }
  }, [appConfig]);

  useEffect(() => {
    // Redirect to app when all checks are ready
    Object.keys(checks)
      .every(check => checksReady[check])
      && !isDebugMode && (() => setTimeout(redirectionPassHealthcheck, HEALTH_CHECK_REDIRECTION_TIME)
      )()
  }, [checksReady]);

  useEffect(() => {
    // Check if Health should not redirect automatically (Debug mode)
    setIsDebugMode(window.location.href.includes('debug'));
  }, []);

  const handleErrors = (checkID, errors, parsed) => {
    const newErrors = parsed
      ? errors.map((error) =>
        ErrorHandler.handle(error, 'Health Check', { warning: false, silent: true })
      )
      : errors;
    setCheckErrors((prev) => ({ ...prev, [checkID]: newErrors }));
  };

  const cleanErrors = (checkID: string) => {
    delete checkErrors[checkID];
    setCheckErrors({ ...checkErrors });
  }

  const handleCheckReady = (checkID, isReady) => {
    setChecksReady(prev => ({ ...prev, [checkID]: isReady }));
  }


  const logoUrl = getHttp().basePath.prepend(
    appConfig.data['customization.enabled'] && appConfig.data['customization.logo.healthcheck'] ?
      getAssetURL(appConfig.data['customization.logo.healthcheck']) :
      getThemeAssetURL('logo.svg')
  );
  const thereAreErrors = Object.keys(checkErrors).length > 0;

  const renderChecks = () => {
    const showLogButton = (thereAreErrors || isDebugMode);
    return Object.keys(checks).map((check, index) => {
      return (
        <CheckResult
          showLogButton={showLogButton}
          key={`health_check_check_${check}`}
          name={check}
          title={checks[check].title}
          awaitFor={checks[check].awaitFor}
          shouldCheck={checks[check].shouldCheck || appConfig.data[`checks.${check}`]}
          validationService={checks[check].validator(appConfig)}
          handleErrors={handleErrors}
          cleanErrors={cleanErrors}
          isLoading={appConfig.isLoading}
          handleCheckReady={handleCheckReady}
          checksReady={checksReady}
          canRetry={checks[check].canRetry}
        />
      );
    });
  };
  
  const addTagsToUrl = (error) => {
    const words = error.split(' ');
    words.forEach((word, index) => {
      if (word.includes('http://') || word.includes('https://')) {
        if (words[index - 1] === 'guide:') {
          if (word.endsWith('.') || word.endsWith(',')) {
            words[index - 2] = `<a href="${word.slice(0, -1)}" target="_blank">${words[index - 2]} ${words[index - 1].slice(0, -1)}</a>${word.slice(-1)}`;
          } else {
            words[index - 2] = `<a href="${word}" target="_blank">${words[index - 2]} ${words[index - 1].slice(0, -1)}</a> `;
          }
          words.splice(index - 1, 2);
        } else{
          if (word.endsWith('.') || word.endsWith(',')) {
            words[index] = `<a href="${word.slice(0, -1)}" target="_blank">${word.slice(0, -1)}</a>${word.slice(-1)}`;
          } else {
            words[index] = `<a href="${word}" target="_blank">${word}</a>`;
          }
        }
      }
    });
    return words.join(' ');
  };

  const renderErrors = () => {
    return Object.keys(checkErrors).map((checkID) =>
      checkErrors[checkID].map((error, index) => (
        <Fragment key={index}>
          <EuiCallOut
            title={(<>{`[${checks[checkID].label}]`} <span dangerouslySetInnerHTML={{__html: addTagsToUrl(error)}}></span></>)}
            color="danger"
            iconType="alert"
            style={{ textAlign: 'left' }}
            data-test-subj='callOutError'
          ></EuiCallOut>
          <EuiSpacer size="xs" />
        </Fragment>
      ))
    )
  };

  return (
    <div className="health-check">
      <img src={logoUrl} className="health-check-logo" alt=""></img>
      <div className="margin-top-30">
        <EuiDescriptionList textStyle="reverse" align="center" type="column">
          {renderChecks()}
        </EuiDescriptionList>
      </div>
      {thereAreErrors && (
        <>
          <EuiSpacer size="xl" />
          {renderErrors()}
        </>
      )}
      {(thereAreErrors || isDebugMode) && (
        <>
          <EuiSpacer size="xl" />
          <EuiFlexGroup justifyContent='center'>
            {thereAreErrors && (
              <EuiFlexItem grow={false}>
                <EuiButton fill href={getHttp().basePath.prepend('/app/wazuh#/settings')}>
                  Go to Settings
                </EuiButton>
              </EuiFlexItem>
            )}
            {isDebugMode && Object.keys(checks).every(check => checksReady[check]) && (
              <EuiFlexItem grow={false}>
                <EuiButton fill onClick={redirectionPassHealthcheck}>
                  Continue
                </EuiButton>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </>
      )
      }
      <EuiSpacer size="xl" />
    </div>
  );
}

export const HealthCheck = compose(withErrorBoundary, withReduxProvider)(HealthCheckComponent);

export const HealthCheckTest = HealthCheckComponent;


