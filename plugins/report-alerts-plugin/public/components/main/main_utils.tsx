/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { HttpSetup } from '../../../../../src/core/public';
import { uiSettingsService } from '../utils/settings_service';
import { GENERATE_REPORT_PARAM } from '../visual_report/constants';

export const getAvailableNotificationsChannels = (configList: any) => {
  let availableChannels = [];
  for (let i = 0; i < configList.length; ++i) {
    let channelEntry = {};
    channelEntry = {
      label: configList[i].config.name,
      id: configList[i].config_id,
    };
    availableChannels.push(channelEntry);
  }
  return availableChannels;
};

type fileFormatsOptions = {
  [key: string]: string;
};

export const fileFormatsUpper: fileFormatsOptions = {
  csv: 'CSV',
  xlsx: 'XLSX',
  pdf: 'PDF',
  png: 'PNG',
};

export const humanReadableDate = (date: string | number | Date) => {
  let readableDate = new Date(date);
  return (
    readableDate.toDateString() + ' @ ' + readableDate.toLocaleTimeString()
  );
};

export const extractFilename = (filename: string) => {
  const index = filename.lastIndexOf('.');
  if (index == -1) {
    return filename;
  }

  return filename.slice(0, index);
};

export const extractFileFormat = (filename: string) => {
  const index = filename.lastIndexOf('.');
  return filename.slice(index + 1);
};

export const getFileFormatPrefix = (fileFormat: string) => {
  var fileFormatPrefix = 'data:' + fileFormat + ';base64,';
  return fileFormatPrefix;
};

export const addReportsTableContent = (data: string | any[]) => {
  let reportsTableItems = [];
  for (let index = 0; index < data.length; ++index) {
    let item = data[index];
    let report = item._source;
    let reportDefinition = report.report_definition;
    let reportParams = reportDefinition.report_params;
    let trigger = reportDefinition.trigger;

    let reportsTableEntry = {
      id: item._id,
      reportName: reportParams.report_name,
      type: trigger.trigger_type,
      sender: `\u2014`,
      opensearchDashboardsRecipients: `\u2014`,
      emailRecipients: `\u2014`,
      reportSource: reportParams.report_source,
      //TODO: wrong name
      timeCreated: report.time_created,
      state: report.state,
      url: report.query_url,
      format: reportParams.core_params.report_format,
    };
    reportsTableItems.push(reportsTableEntry);
  }
  return reportsTableItems;
};

export const addReportDefinitionsTableContent = (data: any) => {
  let reportDefinitionsTableItems = [];
  for (let index = 0; index < data.length; ++index) {
    let item = data[index];
    let reportDefinition = item._source.report_definition;
    let reportParams = reportDefinition.report_params;
    let trigger = reportDefinition.trigger;
    let triggerParams = trigger.trigger_params;
    let reportDefinitionsTableEntry = {
      id: item._id,
      reportName: reportParams.report_name,
      type: trigger.trigger_type,
      owner: `\u2014`, // Todo: replace
      source: reportParams.report_source,
      baseUrl: reportParams.core_params.base_url,
      lastUpdated: reportDefinition.last_updated,
      details:
        trigger.trigger_type === 'On demand'
          ? `\u2014`
          : triggerParams.schedule_type, // e.g. recurring, cron based
      status: reportDefinition.status,
    };
    reportDefinitionsTableItems.push(reportDefinitionsTableEntry);
  }
  return reportDefinitionsTableItems;
};

export const removeDuplicatePdfFileFormat = (filename: string) => {
  return filename.substring(0, filename.length - 4);
};

async function getDataReportURL(
  stream: string,
  fileFormat: string
): Promise<string> {
  if (fileFormat == 'xlsx') {
    const response = await fetch(stream);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  const blob = new Blob([stream]);
  return URL.createObjectURL(blob);
}

export const readDataReportToFile = async (
  stream: string,
  fileFormat: string,
  fileName: string
) => {
  const url = await getDataReportURL(stream, fileFormat);
  let link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const readStreamToFile = async (
  stream: string,
  fileFormat: string,
  fileName: string
) => {
  let link = document.createElement('a');
  if (fileName.includes('csv') || fileName.includes('xlsx')) {
    readDataReportToFile(stream, fileFormat, fileName);
    return;
  }
  let fileFormatPrefix = getFileFormatPrefix(fileFormat);
  let url = fileFormatPrefix + stream;
  if (typeof link.download !== 'string') {
    window.open(url, '_blank');
    return;
  }
  link.download = fileName;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateReportFromDefinitionId = async (
  reportDefinitionId: string,
  httpClient: HttpSetup
) => {
  let status = false;
  let permissionsError = false;
  await httpClient
    .post(`../api/reporting/generateReport/${reportDefinitionId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      query: uiSettingsService.getSearchParams(),
    })
    .then(async (response: any) => {
      // for emailing a report, this API response doesn't have response body
      if (!response) return;
      const fileFormat = extractFileFormat(response['filename']);
      const fileName = response['filename'];
      if (fileFormat === 'csv' || fileFormat === 'xlsx') {
        await readStreamToFile(await response['data'], fileFormat, fileName);
        status = true;
        return;
      }

      // generate reports in browser is memory intensive, do it in a new process by removing referrer
      const a = document.createElement('a');
      a.href =
        window.location.origin +
        `${response.queryUrl}&${GENERATE_REPORT_PARAM}=${response.reportId}`;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.click();
      status = true;
    })
    .catch((error) => {
      console.log('error on generating report:', error);
      if (error.body.statusCode === 403) {
        permissionsError = true;
      }
      status = false;
    });
  return {
    status: status,
    permissionsError: permissionsError,
  };
};

export const generateReportById = async (
  reportId: string,
  httpClient: HttpSetup,
  handleSuccessToast,
  handleErrorToast,
  handlePermissionsMissingToast
) => {
  await httpClient
    .get(`../api/reporting/generateReport/${reportId}`, {
      query: uiSettingsService.getSearchParams(),
    })
    .then(async (response) => {
      //TODO: duplicate code, extract to be a function that can reuse. e.g. handleResponse(response)
      const fileFormat = extractFileFormat(response['filename']);
      const fileName = response['filename'];
      if (fileFormat === 'csv' || fileFormat === 'xlsx') {
        await readStreamToFile(await response['data'], fileFormat, fileName);
        handleSuccessToast();
        return response;
      }

      // generate reports in browser is memory intensive, do it in a new process by removing referrer
      const a = document.createElement('a');
      a.href =
        window.location.origin +
        `${response.queryUrl}&${GENERATE_REPORT_PARAM}=${reportId}`;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.click();
    })
    .catch((error) => {
      console.log('error on generating report by id:', error);
      if (error.body.statusCode === 403) {
        handlePermissionsMissingToast();
      } else if (error.body.statusCode === 503) {
        handleErrorToast(
          i18n.translate('opensearch.reports.utils.errorTitle', {
            defaultMessage: 'Error generating report.',
          }),
          i18n.translate('opensearch.reports.utils.errorText', {
            defaultMessage:
              'Timed out generating report ID {reportId}. Try again later.',
            values: { reportId: reportId },
            description: 'Error number toast',
          })
        );
      } else {
        handleErrorToast();
      }
    });
};
