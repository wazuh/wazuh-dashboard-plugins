/*
 * Wazuh app - Tools to check the version of the plugin
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { GenericRequest } from '../react-services/generic-request';
import { AxiosResponse } from 'axios';
import _ from 'lodash';
import {
  version as appVersion,
  revision as appRevision,
} from '../../package.json';
import { getCookies, getToasts } from '../kibana-services';
import { ErrorToastOptions } from 'opensearch_dashboards/public';
import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { ReactNode } from 'x-pack/node_modules/@types/react';
import {
  PLUGIN_PLATFORM_NAME,
  PLUGIN_APP_NAME,
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';

type TAppInfo = {
  revision: string;
  'app-version': string;
};

type TAppInfoResponse = {
  statusCode: number;
  data: TAppInfo;
};

export const checkPluginVersion = async () => {
  try {
    const response: AxiosResponse<TAppInfoResponse> =
      await GenericRequest.request('GET', '/api/setup');
    const { revision, 'app-version': appRevision } = response.data.data;
    return checkClientAppVersion({ revision, 'app-version': appRevision });
  } catch (error) {
    console.error(`Error when getting the plugin version: ${error}`);
  }
};

const checkClientAppVersion = (appInfo: TAppInfo) => {
  if (
    appInfo['app-version'] !== appVersion ||
    appInfo.revision !== appRevision
  ) {
    const toastOptions: ErrorToastOptions = {
      title: i18n.translate('wazuh.core.pluginVersion.conflictTitle', {
        defaultMessage: 'Conflict with the {appName} version',
        values: { appName: PLUGIN_APP_NAME },
      }),
      toastLifeTimeMs: 50000,
      toastMessage: i18n.translate('wazuh.core.pluginVersion.conflictToast', {
        defaultMessage:
          'The version of the {appName} in your browser does not correspond with the app version installed in {platformName}. Please, clear your browser cache. For more info check the full error.',
        values: {
          appName: PLUGIN_APP_NAME,
          platformName: PLUGIN_PLATFORM_NAME,
        },
      }),
    };
    const troubleshootingUrl = webDocumentationLink(
      PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
    );
    const message: ReactNode = (
      <>
        <p>
          <FormattedMessage
            id='wazuh.core.pluginVersion.conflictDetail'
            defaultMessage='The version of the {appName} in your browser {browserVersion} does not correspond with the version installed in {platformName} {installedVersion}.'
            values={{
              appName: PLUGIN_APP_NAME,
              platformName: PLUGIN_PLATFORM_NAME,
              browserVersion: (
                <b>
                  {appVersion} - {appRevision}
                </b>
              ),
              installedVersion: (
                <b>
                  {appInfo['app-version']} - {appInfo.revision}
                </b>
              ),
            }}
          />
        </p>
        <p>
          {i18n.translate('wazuh.core.pluginVersion.clearCache', {
            defaultMessage:
              'Please, clear your browser cache following these steps.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.core.pluginVersion.restartPlatform', {
            defaultMessage:
              'If the error persists, restart {platformName} as well.',
            values: { platformName: PLUGIN_PLATFORM_NAME },
          })}
        </p>
        <p>
          <FormattedMessage
            id='wazuh.core.pluginVersion.troubleshooting'
            defaultMessage='For more information check our troubleshooting section {link}'
            values={{
              link: (
                <a
                  href={troubleshootingUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {i18n.translate(
                    'wazuh.core.pluginVersion.troubleshootingLink',
                    {
                      defaultMessage: 'here.',
                    },
                  )}
                </a>
              ),
            }}
          />
        </p>
      </>
    );

    const error: Error = {
      name: '',
      message,
      stack: i18n.translate('wazuh.core.pluginVersion.clearCacheSteps', {
        defaultMessage:
          ' Steps to clear cache:\n\n      1 - Open the Dev tools of your browser (Press F12).\n      2 - Go to the "Network" tab.\n      3 - Check the "Disable cache" option.\n      4 - Reload the page (Press F5).\n\nThis message should not be displayed again.',
      }),
    };

    const stackSafari = i18n.translate(
      'wazuh.core.pluginVersion.clearCacheStepsSafari',
      {
        defaultMessage:
          ' Steps to clear cache:\n\n      1 - Select the "Safari” menu, then choose "Preferences".\n      2 - Select the "Advanced” tab and check the "Show Develop menu in menu bar” option.\n      3 - Close the Preferences window.\n      4 - If you don’t have the Menu Bar enabled, select the settings gear, then choose "Show Menu Bar".\n      5 - Open "Develop" > "Show Web Inspector".\n      6 - Go to the "Network" tab.\n      7 - Check the "Ignore cache when loading resources" option.\n      8 - Reload the page.\n\nThis message should not be displayed again.',
      },
    );

    const isSafari =
      navigator.vendor &&
      navigator.vendor.indexOf('Apple') > -1 &&
      navigator.userAgent &&
      navigator.userAgent.indexOf('CriOS') == -1 &&
      navigator.userAgent.indexOf('FxiOS') == -1;

    if (isSafari) error.stack = stackSafari;

    getToasts().addError(error, toastOptions);

    clearBrowserInfo(appInfo);
  } else {
    if (window.history.state == 'refreshed') {
      window.history.replaceState('', 'wazuh'); // TODO: this seems to redirect to old plugin path
    }
    const storeAppInfo = localStorage.getItem('appInfo');
    !storeAppInfo && updateAppInfo(appInfo);
  }
};

function clearBrowserInfo(appInfo: TAppInfo) {
  console.warn('Clearing browser cache');
  //remove cookies
  const cookies = getCookies().getAll();
  Object.keys(cookies).forEach(cookie => getCookies().remove(cookie));

  //remove cache
  if (window.caches) {
    window.caches.keys().then(function (names) {
      for (let name of names) caches.delete(name);
    });
  }

  //update localStorage
  updateAppInfo(appInfo);
}

function updateAppInfo(appInfo: TAppInfo) {
  localStorage.setItem('appInfo', JSON.stringify(appInfo));
}
