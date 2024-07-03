/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestParams } from '@opensearch-project/opensearch';
import path from 'path';
import { ILegacyScopedClusterClient } from '../../../../src/core/server';
import {
  reportDefinitionSchema,
  ReportDefinitionSchemaType,
  reportSchema,
  ReportSchemaType,
} from '../model';
import { REPORT_TYPE } from '../routes/utils/constants';

export const isValidRelativeUrl = (relativeUrl: string) => {
  let normalizedRelativeUrl = relativeUrl;
  if (
    !relativeUrl.includes('observability#/notebooks') &&
    !relativeUrl.includes('notebooks-dashboards')
  ) {
    normalizedRelativeUrl = path.posix.normalize(relativeUrl);
  }

  // check pattern
  // ODFE pattern: /app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g
  // AES pattern: /_plugin/kibana/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g
  const isValid = regexRelativeUrl.test(normalizedRelativeUrl);
  return isValid;
};

/**
 * moment.js isValid() API fails to validate time duration, so use regex
 * https://github.com/moment/moment/issues/1805
 **/
export const regexDuration = /^([-+]?)P(?=\d|T[-+]?\d)(?:([-+]?\d+)Y)?(?:([-+]?\d+)M)?(?:([-+]?\d+)([DW]))?(?:T(?:([-+]?\d+)H)?(?:([-+]?\d+)M)?(?:([-+]?\d+(?:\.\d+)?)S)?)?$/;
export const regexEmailAddress = /\S+@\S+\.\S+/;
export const regexReportName = /^[\w\-\s\(\)\[\]\,\_\-+]+$/;
export const regexRelativeUrl = /^\/(_plugin\/kibana\/|_dashboards\/)?app\/(dashboards|visualize|discover|discoverLegacy|data-explorer\/discover\/?|observability-dashboards|observability-notebooks|notebooks-dashboards\?view=output_only(&security_tenant=.+)?)(\?security_tenant=.+)?#\/(notebooks\/|view\/|edit\/)?[^\/]+$/;

export const validateReport = async (
  client: ILegacyScopedClusterClient,
  report: ReportSchemaType,
  basePath: string
) => {
  report.query_url = report.query_url.replace(basePath, '');
  report.report_definition.report_params.core_params.base_url = report.report_definition.report_params.core_params.base_url.replace(
    basePath,
    ''
  );
  // validate basic schema
  report = reportSchema.validate(report);
  // parse to retrieve data
  const {
    query_url: queryUrl,
    report_definition: {
      report_params: { report_source: reportSource },
    },
  } = report;
  // Check if saved object actually exists
  await validateSavedObject(client, queryUrl, reportSource);
  return report;
};

export const validateReportDefinition = async (
  client: ILegacyScopedClusterClient,
  reportDefinition: ReportDefinitionSchemaType,
  basePath: string
) => {
  reportDefinition.report_params.core_params.base_url = reportDefinition.report_params.core_params.base_url.replace(
    basePath,
    ''
  );
  // validate basic schema
  reportDefinition = reportDefinitionSchema.validate(reportDefinition);
  // parse to retrieve data
  const {
    report_params: {
      report_source: reportSource,
      core_params: { base_url: baseUrl },
    },
  } = reportDefinition;
  // Check if saved object actually exists
  await validateSavedObject(client, baseUrl, reportSource);
  return reportDefinition;
};

const validateSavedObject = async (
  client: ILegacyScopedClusterClient,
  url: string,
  source: REPORT_TYPE
) => {
  const getId = (url: string) => {
    return url
      .split('/')
      .pop()
      ?.replace(/\?\S+$/, '');
  };
  const getType = (source: REPORT_TYPE) => {
    switch (source) {
      case REPORT_TYPE.dashboard:
        return 'dashboard';
      case REPORT_TYPE.savedSearch:
        return 'search';
      case REPORT_TYPE.visualization:
        return 'visualization';
      case REPORT_TYPE.notebook:
        return 'notebook';
    }
  };

  let exist = false;
  let savedObjectId = '';
  if (getType(source) === 'notebook') {
    // no backend check for notebooks because we would just be checking against the notebooks api again
    exist = true;
  } else {
    savedObjectId = `${getType(source)}:${getId(url)}`;
    const params: RequestParams.Exists = {
      index: '.kibana',
      id: savedObjectId,
    };
    exist = await client.callAsCurrentUser('exists', params);
  }
  if (!exist) {
    throw Error(`saved object with id ${savedObjectId} does not exist`);
  }
};
