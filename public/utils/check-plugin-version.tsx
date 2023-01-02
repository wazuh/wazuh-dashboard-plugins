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
import { version as appVersion, revision as appRevision } from '../../package.json';
import { getCookies, getToasts } from '../kibana-services';
import { ErrorToastOptions } from 'kibana/public';
import React from 'react';
import { ReactNode } from 'x-pack/node_modules/@types/react';
import { PLUGIN_PLATFORM_NAME } from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

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
    const response: AxiosResponse<TAppInfoResponse> = await GenericRequest.request(
      'GET',
      '/api/setup'
    );
    const { revision, 'app-version': appRevision } = response.data.data;
    return checkClientAppVersion({ revision, 'app-version': appRevision });
  } catch (error) {
    console.error(`Error when getting the plugin version: ${error}`);
  }
};

const checkClientAppVersion = (appInfo: TAppInfo) => {
  if (appInfo['app-version'] !== appVersion || appInfo.revision !== appRevision) {
    const wazuhVersionErrorDescription = i18n.translate(
      'utils.checkPlugin.wazuhAppConflictDescription',
      {
        defaultMessage:
          'The version of the Wazuh app in your browser does not correspond with the app version installed in . Please, clear your browser cache. For more info check the full error.',
      },
    );
    const toastOptions: ErrorToastOptions = {
      title: i18n.translate('utils.checkPlugin.wazuhAppConflictTitle', {
        defaultMessage: 'Conflict with the Wazuh app version',
      }),
      toastLifeTimeMs: 50000,
      toastMessage: i18n.translate('utils.checkPlugin.wazuhAppConflictDescription', {
        defaultMessage:
          `The version of the Wazuh app in your browser does not correspond with the app version installed in ${PLUGIN_PLATFORM_NAME}. Please, clear your browser cache. For more info check the full error.`,
      }),
    };

    const troubleshootingUrl = webDocumentationLink('user-manual/elasticsearch/troubleshooting.html');

    const message: ReactNode = (
      <>
        <p>
          {' '}
          {i18n.translate('utils.checkPlugin.wazuhAppVersion', {
            defaultMessage: 'The version of the Wazuh app in your browser',
          })}{' '}
          <b>
            {appVersion} - {appRevision}
          </b>{' '}
          {i18n.translate('utils.checkPlugin.appVersionError', {
            defaultMessage: `does not correspond with the app version installed in
              ${PLUGIN_PLATFORM_NAME}`,
          })}{' '}
          <b>
            {appInfo['app-version']} - {appInfo.revision}
          </b>
          .
        </p>
        <p>
          {i18n.translate('utils.checkPlugin.cacheClearMsg', {
            defaultMessage:
              'Please, clear your browser cache following these steps.',
          })}
        </p>
        <p>
          {i18n.translate('utils.checkPlugin.restartPlugin', {
            defaultMessage: `If the error persists, restart ${PLUGIN_PLATFORM_NAME} as well.`,
          })}
        </p>
        <p>
          {i18n.translate('utils.checkPlugin.troubleshootSection', {
            defaultMessage:
              'For more information check our troubleshooting section',
          })}{' '}
          <a href={troubleshootingUrl} target='_blank'>
            { i18n.translate('utils.checkPlugin.troubleshootSectionLink', {
              defaultMessage: 'here.',
            })}
          </a>
        </p>
      </>
    );

    const error: Error = {
      name: '',
      message,
      stack: i18n.translate('utils.checkPlugin.stepsToClearCache', {
        defaultMessage: ` Steps to clear cache:

                1 - Open the Dev tools of your browser (Press F12).
                2 - Go to the "Network" tab.
                3 - Check the "Disable cache" option.
                4 - Reload the page (Press F5).

          This message should not be displayed again.`,
      })
    };

    const stackSafari = i18n.translate('utils.checkPlugin.stepToClearCacheInSafari', {
      defaultMessage: ` Steps to clear cache:

            1 - Select the "Safari” menu, then choose "Preferences".
            2 - Select the "Advanced” tab and check the "Show Develop menu in menu bar” option.
            3 - Close the Preferences window.
            4 - If you don’t have the Menu Bar enabled, select the settings gear, then choose "Show Menu Bar".
            5 - Open "Develop" > "Show Web Inspector".
            6 - Go to the "Network" tab.
            7 - Check the "Ignore cache when loading resources" option.
            8 - Reload the page.

      This message should not be displayed again.`,
    })

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
      window.history.replaceState('', 'wazuh');
    }
    const storeAppInfo = localStorage.getItem('appInfo');
    !storeAppInfo && updateAppInfo(appInfo);
  }
};

function clearBrowserInfo(appInfo: TAppInfo) {
  console.warn('Clearing browser cache');
  //remove cookies
  const cookies = getCookies().getAll();
  Object.keys(cookies).forEach((cookie) => getCookies().remove(cookie));

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
