/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-restricted-globals */
//@ts-check
import { i18n } from '@osd/i18n';
import $ from 'jquery';
import { parse } from 'url';
import { readStreamToFile } from '../main/main_utils';
import { uiSettingsService } from '../utils/settings_service';
import {
  GENERATE_REPORT_PARAM,
  GENERATE_REPORT_PARAM_REGEX,
} from '../visual_report/constants';
import { generateReport } from '../visual_report/generate_report';
import {
  addSuccessOrFailureToast,
  contextMenuCreateReportDefinition,
  contextMenuViewReports,
  displayLoadingModal,
  getTimeFieldsFromUrl,
  replaceQueryURL,
} from './context_menu_helpers';
import {
  getMenuItem,
  popoverMenu,
  popoverMenuDiscover,
} from './context_menu_ui';

const generateInContextReport = async (
  timeRanges,
  queryUrl,
  fileFormat,
  rest = {}
) => {
  displayLoadingModal();
  const baseUrl = queryUrl.substr(0, queryUrl.indexOf('?'));
  // Add selected tenant info to url
  try {
    const tenant = await getTenantInfoIfExists();
    if (tenant) {
      queryUrl = addTenantToURL(queryUrl, tenant);
    }
  } catch (error) {
    addSuccessOrFailureToast('failure');
    console.log(`failed to get user tenant: ${error}`);
  }

  let reportSource = '';
  if (/\/app\/dashboards/.test(baseUrl)) {
    reportSource = 'Dashboard';
  } else if (/\/app\/visualize/.test(baseUrl)) {
    reportSource = 'Visualization';
  } else if (/\/app\/(discover|data-explorer)/.test(baseUrl)) {
    reportSource = 'Saved search';
  }

  // create query body
  const contextMenuOnDemandReport = {
    query_url: queryUrl,
    time_from: timeRanges.time_from.valueOf(),
    time_to: timeRanges.time_to.valueOf(),
    report_definition: {
      report_params: {
        report_name: 'On_demand_report',
        report_source: reportSource,
        description: 'In-context report download',
        core_params: {
          base_url: baseUrl,
          report_format: fileFormat,
          time_duration: timeRanges.time_duration,
          ...rest,
        },
      },
      delivery: {
        configIds: [''],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'On demand',
      },
    },
  };

  fetch(
    `${getApiPath()}/reporting/generateReport?${new URLSearchParams(
      uiSettingsService.getSearchParams()
    )}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'reporting',
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6',
        pragma: 'no-cache',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      method: 'POST',
      body: JSON.stringify(contextMenuOnDemandReport),
      referrerPolicy: 'strict-origin-when-cross-origin',
      mode: 'cors',
      credentials: 'include',
    }
  )
    .then(async (response) => [response.status, await response.json()])
    .then(async ([status, data]) => {
      if (status !== 200) {
        if (status === 403) {
          addSuccessOrFailureToast('permissionsFailure');
        } else if (status === 503) {
          addSuccessOrFailureToast('timeoutFailure', reportSource);
        } else {
          addSuccessOrFailureToast('failure');
        }
      } else if (fileFormat === 'pdf' || fileFormat === 'png') {
        try {
          await generateReport(data.reportId);
          addSuccessOrFailureToast('success');
        } catch (error) {
          console.error(error);
          addSuccessOrFailureToast('failure');
        }
      } else if (data.data) {
        await readStreamToFile(data.data, fileFormat, data.filename);
      }
      $('#reportGenerationProgressModal').remove();
    });
};

// try to match uuid and user entered custom-id followed by '?' in URL, which would be the saved search id for discover URL
// custom id example: v1s-f00-b4r1-01, Filebeat-Apache-Dashboard-ecs,
const getUuidFromUrl = () => window.location.href.match(/([0-9a-zA-Z-]+)\?/);
const isDiscover = () => window.location.href.includes('discover');

// open Download drop-down
$(function () {
  $(document).on('click', '#downloadReport', function () {
    const popoverScreen = document.querySelectorAll('body');
    if (popoverScreen) {
      try {
        const reportPopover = document.createElement('div');
        // eslint-disable-next-line no-unsanitized/property
        reportPopover.innerHTML = isDiscover()
          ? popoverMenuDiscover(getUuidFromUrl())
          : popoverMenu(getUuidFromUrl());
        popoverScreen[0].appendChild(reportPopover.children[0]);
        $('#reportPopover').show();
      } catch (e) {
        console.log('error displaying menu:', e);
      }
    }
  });

  // generate PDF onclick
  $(document).on('click', '#generatePDF', function () {
    const timeRanges = getTimeFieldsFromUrl();
    const queryUrl = replaceQueryURL(location.href);
    generateInContextReport(timeRanges, queryUrl, 'pdf');
  });

  // generate PNG onclick
  $(document).on('click', '#generatePNG', function () {
    const timeRanges = getTimeFieldsFromUrl();
    const queryUrl = replaceQueryURL(location.href);
    generateInContextReport(timeRanges, queryUrl, 'png');
  });

  // generate CSV onclick
  $(document).on('click', '#generateCSV', function () {
    const timeRanges = getTimeFieldsFromUrl();
    const queryUrl = replaceQueryURL(location.href);
    const saved_search_id = getUuidFromUrl()[1];
    generateInContextReport(timeRanges, queryUrl, 'csv', { saved_search_id });
  });

  // generate XLSX onclick
  $(document).on('click', '#generateXLSX', function () {
    const timeRanges = getTimeFieldsFromUrl();
    const queryUrl = replaceQueryURL(location.href);
    const saved_search_id = getUuidFromUrl()[1];
    generateInContextReport(timeRanges, queryUrl, 'xlsx', { saved_search_id });
  });

  // navigate to Create report definition page with report source and pre-set time range
  $(document).on('click', '#createReportDefinition', function () {
    contextMenuCreateReportDefinition(this.baseURI);
  });

  // redirect to Reporting home page
  $(document).on('click', '#viewReports', function () {
    contextMenuViewReports();
  });

  // close popover menu on click outside
  $('body').on('click', function (e) {
    if ($(e.target).data('toggle') !== '#downloadReport') {
      $('#reportPopover').remove();
    }
  });

  // close modal/toast
  $(function () {
    // close modal with 'x' in upper-right modal
    $(document).on('click', '#closeReportGenerationModal', function () {
      $('#reportGenerationProgressModal').remove();
    });

    // close modal with the close EuiButton
    $(document).on('click', '#closeReportGenerationModalButton', function () {
      $('#reportGenerationProgressModal').remove();
    });

    // close the toast that appears upon successful report generation
    $(document).on('click', '#closeReportSuccessToast', function () {
      $('#reportSuccessToast').remove();
    });

    // close the toast that apepars upon failure of report generation
    $(document).on('click', '#closeReportFailureToast', function () {
      $('#reportFailureToast').remove();
    });

    // close permissions failure toast
    $(document).on('click', '#permissionsMissingErrorToast', function () {
      $('#permissionsMissingErrorToast').remove();
    });
  });

  checkURLParams();
  locationHashChanged();
});

/* generate a report if flagged in URL params */
const checkURLParams = async () => {
  const [hash, query] = location.href.split('#')[1].split('?');
  const params = new URLSearchParams(query);
  const id = params.get(GENERATE_REPORT_PARAM);
  if (!id) return;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  displayLoadingModal();
  try {
    await generateReport(id, 30000);
    window.history.replaceState(
      {},
      '',
      `#${hash}?${query.replace(GENERATE_REPORT_PARAM_REGEX, '')}`
    );
    addSuccessOrFailureToast('success');
  } catch (error) {
    console.error(error);
    addSuccessOrFailureToast('failure');
  } finally {
    $('#reportGenerationProgressModal').remove();
  }
};

const isDiscoverNavMenu = (navMenu) => {
  return (
    (navMenu[0].children.length === 5 || navMenu[0].children.length === 6) &&
    ($('[data-test-subj="breadcrumb first"]').prop('title') === 'Discover' ||
      $('[data-test-subj="breadcrumb first last"]').prop('title') ===
        'Discover')
  );
};

const isDashboardNavMenu = (navMenu) => {
  return (
    (navMenu[0].children.length === 4 || navMenu[0].children.length === 6) &&
    $('[data-test-subj="breadcrumb first"]').prop('title') === 'Dashboards'
  );
};

const isVisualizationNavMenu = (navMenu) => {
  return (
    navMenu[0].children.length === 3 &&
    $('[data-test-subj="breadcrumb first"]').prop('title') === 'Visualize'
  );
};

function locationHashChanged() {
  const observer = new MutationObserver(function (mutations) {
    const navMenu = document.querySelectorAll(
      'nav.euiHeaderLinks > div.euiHeaderLinks__list'
    );
    if (
      navMenu &&
      navMenu.length &&
      (isDiscoverNavMenu(navMenu) ||
        isDashboardNavMenu(navMenu) ||
        isVisualizationNavMenu(navMenu))
    ) {
      try {
        if ($('#downloadReport').length) {
          return;
        }
        const menuItem = document.createElement('div');
        menuItem.innerHTML = getMenuItem(
          i18n.translate('opensearch.reports.menu.name', {
            defaultMessage: 'Reporting',
          })
        );
        navMenu[0].insertBefore(menuItem.children[0], navMenu[0].lastChild);
      } catch (e) {
        console.log(e);
      } finally {
        observer.disconnect();
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    //document.body is node target to observe
    childList: true, //This is a must have for the observer with subtree
    subtree: true, //Set to true if changes must also be observed in descendants.
  });
}

$(window).one('hashchange', function (e) {
  locationHashChanged();
});
/**
 * for navigating to tabs from OpenSearch Dashboards sidebar, it uses history.pushState, which doesn't trigger onHashchange.
 * https://stackoverflow.com/questions/4570093/how-to-get-notified-about-changes-of-the-history-via-history-pushstate/4585031
 */
(function (history) {
  const pushState = history.pushState;
  history.pushState = function (state) {
    if (typeof history.onpushstate === 'function') {
      history.onpushstate({ state: state });
    }
    return pushState.apply(history, arguments);
  };
})(window.history);

window.onpopstate = history.onpushstate = () => {
  locationHashChanged();
};

const getApiPath = () => {
  if (window.location.href.includes('/data-explorer/discover/')) return '../../../api'
  if (window.location.href.includes('/data-explorer/discover')) return '../../api'
  return '../api'
}

async function getTenantInfoIfExists() {
  const res = await fetch(`${getApiPath()}/v1/multitenancy/tenant`, {
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'reporting',
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6',
      pragma: 'no-cache',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    },
    method: 'GET',
    referrerPolicy: 'strict-origin-when-cross-origin',
    mode: 'cors',
    credentials: 'include',
  })
    .then((response) => {
      if (response.status === 404) {
        // endpoint doesn't exist, security plugin is not enabled.
        return undefined;
      } else {
        return response.text();
      }
    })
    .then((tenant) => {
      if (tenant === '') {
        tenant = 'global';
      } else if (tenant === '__user__') {
        tenant = 'private';
      }
      return tenant;
    });

  return res;
}

// helper function to add tenant info to url(if tenant is available)
function addTenantToURL(url, userRequestedTenant) {
  // build fake url from relative url
  const fakeUrl = `http://opensearch.com${url}`;
  const tenantKey = 'security_tenant';
  const tenantKeyAndValue =
    tenantKey + '=' + encodeURIComponent(userRequestedTenant);

  const { pathname, search } = parse(fakeUrl);
  const queryDelimiter = !search ? '?' : '&';
  // The url parser returns null if the search is empty. Change that to an empty
  // string so that we can use it to build the values later
  if (search && search.toLowerCase().indexOf(tenantKey) > -1) {
    // If we for some reason already have a tenant in the URL we skip any updates
    return url;
  }

  // A helper for finding the part in the string that we want to extend/replace
  const valueToReplace = pathname + (search || '');
  const replaceWith = valueToReplace + queryDelimiter + tenantKeyAndValue;

  return url.replace(valueToReplace, replaceWith);
}
