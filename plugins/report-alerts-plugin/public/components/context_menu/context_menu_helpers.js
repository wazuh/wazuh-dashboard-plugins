/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import moment from 'moment';
import {
  reportGenerationInProgressModal,
  reportGenerationSuccess,
  reportGenerationFailure,
  permissionsMissingOnGeneration,
} from './context_menu_ui';
import { timeRangeMatcher } from '../utils/utils';
import { unhashUrl } from '../../../../../src/plugins/opensearch_dashboards_utils/public';
import { PLUGIN_ID } from '../../../common';
import { applicationService } from '../utils/application_service';

const getReportSourceURL = (baseURI) => {
  const url = baseURI.substr(0, baseURI.indexOf('?'));
  const reportSourceId = url.substr(url.lastIndexOf('/') + 1, url.length);
  return reportSourceId;
};

export const contextMenuViewReports = () =>
  applicationService.getApplication().navigateToApp(PLUGIN_ID);

export const getTimeFieldsFromUrl = () => {
  const url = unhashUrl(window.location.href);

  let [, fromDateString, toDateString] = url.match(timeRangeMatcher) ?? [
    '',
    'now-15m',
    'now',
  ];
  fromDateString = decodeURIComponent(fromDateString.replace(/[']+/g, ''));
  // convert time range to from date format in case time range is relative
  const fromDateFormat = dateMath.parse(fromDateString);
  toDateString = decodeURIComponent(toDateString.replace(/[']+/g, ''));
  const toDateFormat = dateMath.parse(toDateString, { roundUp: true });

  const timeDuration = moment.duration(toDateFormat.diff(fromDateFormat));

  return {
    time_from: fromDateFormat,
    time_to: toDateFormat,
    time_duration: timeDuration.toISOString(),
  };
};

export const contextMenuCreateReportDefinition = (baseURI) => {
  const reportSourceId = getReportSourceURL(baseURI);
  let reportSource = '';
  const timeRanges = getTimeFieldsFromUrl();

  // check report source
  if (/\/app\/dashboards/.test(baseURI)) {
    reportSource = 'dashboard:';
  } else if (/\/app\/visualize/.test(baseURI)) {
    reportSource = 'visualize:';
  } else if (/\/app\/discover/.test(baseURI)) {
    reportSource = 'discover:';
  }
  reportSource += reportSourceId.toString();
  window.location.assign(
    `reports-alerts#/create?previous=${reportSource}?timeFrom=${timeRanges.time_from.toISOString()}?timeTo=${timeRanges.time_to.toISOString()}`
  );
};

export const displayLoadingModal = () => {
  const opensearchDashboardsBody = document.getElementById(
    'opensearch-dashboards-body'
  );
  if (opensearchDashboardsBody) {
    try {
      const loadingModal = document.createElement('div');
      loadingModal.innerHTML = reportGenerationInProgressModal();
      opensearchDashboardsBody.appendChild(loadingModal.children[0]);
    } catch (e) {
      console.log('error displaying loading modal:', e);
    }
  }
};

export const addSuccessOrFailureToast = (status, reportSource) => {
  const generateToast = document.querySelectorAll('.euiGlobalToastList');
  if (generateToast) {
    try {
      const generateInProgressToast = document.createElement('div');
      if (status === 'success') {
        generateInProgressToast.innerHTML = reportGenerationSuccess();
        setTimeout(function () {
          document.getElementById('reportSuccessToast').style.display = 'none';
        }, 6000); // closes toast automatically after 6s
      } else if (status === 'failure') {
        generateInProgressToast.innerHTML = reportGenerationFailure();
        setTimeout(function () {
          document.getElementById('reportFailureToast').style.display = 'none';
        }, 6000);
      } else if (status === 'timeoutFailure') {
        generateInProgressToast.innerHTML = reportGenerationFailure(
          'Error generating report.',
          `Timed out generating on-demand report from ${reportSource}. Try again later.`
        );
        setTimeout(function () {
          document.getElementById('reportFailureToast').style.display = 'none';
        }, 6000);
      } else if (status === 'permissionsFailure') {
        generateInProgressToast.innerHTML = permissionsMissingOnGeneration();
        setTimeout(function () {
          document.getElementById(
            'permissionsMissingErrorToast'
          ).style.display = 'none';
        }, 6000);
      }
      generateToast[0].appendChild(generateInProgressToast.children[0]);
    } catch (e) {
      console.log('error displaying toast', e);
    }
  }
};

export const replaceQueryURL = (pageUrl) => {
  // we unhash the url in case OpenSearch Dashboards advanced UI setting 'state:storeInSessionStorage' is turned on
  const unhashedUrl = new URL(unhashUrl(pageUrl));
  let queryUrl = unhashedUrl.pathname + unhashedUrl.hash;
  let [, fromDateStringMatch, toDateStringMatch] =
    queryUrl.match(timeRangeMatcher);
  const fromDateString = decodeURIComponent(
    fromDateStringMatch.replace(/[']+/g, '')
  );

  // convert time range to from date format in case time range is relative
  const fromDateFormat = dateMath.parse(fromDateString);
  const toDateString = decodeURIComponent(
    toDateStringMatch.replace(/[']+/g, '')
  );
  const toDateFormat = dateMath.parse(toDateString, { roundUp: true });

  // replace to and from dates with absolute date
  queryUrl = queryUrl.replace(
    fromDateStringMatch,
    "'" + fromDateFormat.toISOString() + "'"
  );
  queryUrl = queryUrl.replace(
    toDateStringMatch,
    "'" + toDateFormat.toISOString() + "'"
  );
  return queryUrl;
};
