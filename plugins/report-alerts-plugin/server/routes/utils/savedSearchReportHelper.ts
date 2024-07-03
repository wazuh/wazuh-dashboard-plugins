/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildRequestBody,
  convertToCSV,
  convertToExcel,
  getOpenSearchData,
  getSelectedFields,
  metaData,
} from './dataReportHelpers';
import {
  ILegacyClusterClient,
  ILegacyScopedClusterClient,
  Logger,
} from '../../../../../src/core/server';
import { getFileName, callCluster } from './helpers';
import { CreateReportResultType } from './types';
import { RequestParams } from '@elastic/elasticsearch';
import esb from 'elastic-builder';
import { FORMAT } from './constants';

/**
 * Specify how long scroll context should be maintained for scrolled search
 */
const scrollTimeout = '1m';

export async function createSavedSearchReport(
  report: any,
  client: ILegacyClusterClient | ILegacyScopedClusterClient,
  dateFormat: string,
  csvSeparator: string,
  allowLeadingWildcards: boolean,
  isScheduledTask: boolean = true,
  logger: Logger,
  timezone: string
): Promise<CreateReportResultType> {
  const params = report.report_definition.report_params;
  const reportFormat = params.core_params.report_format;
  const reportName = params.report_name;

  await populateMetaData(client, report, isScheduledTask, logger);
  const data = await generateReportData(
    client,
    params.core_params,
    dateFormat,
    csvSeparator,
    allowLeadingWildcards,
    isScheduledTask,
    logger,
    timezone
  );

  const curTime = new Date();
  const timeCreated = curTime.valueOf();
  const fileName = getFileName(reportName, curTime) + '.' + reportFormat;
  return {
    timeCreated,
    dataUrl: data,
    fileName,
  };
}

/**
 * Populate parameters and saved search info related to meta data object.
 * @param client  OpenSearch client
 * @param report  Report input
 */
async function populateMetaData(
  client: ILegacyClusterClient | ILegacyScopedClusterClient,
  report: any,
  isScheduledTask: boolean,
  logger: Logger
) {
  metaData.saved_search_id =
    report.report_definition.report_params.core_params.saved_search_id;
  metaData.report_format =
    report.report_definition.report_params.core_params.report_format;
  metaData.start = report.time_from;
  metaData.end = report.time_to;

  // Get saved search info
  let resIndexPattern: any = {};
  const ssParams = {
    index: '.kibana',
    id: 'search:' + metaData.saved_search_id,
  };
  const ssInfos = await callCluster(client, 'get', ssParams, isScheduledTask);

  metaData.sorting = ssInfos._source.search.sort;
  metaData.type = ssInfos._source.type;
  metaData.searchSourceJSON =
    ssInfos._source.search.kibanaSavedObjectMeta.searchSourceJSON;

  // Get the list of selected columns in the saved search.Otherwise select all the fields under the _source
  await getSelectedFields(ssInfos._source.search.columns);

  // Get index name
  for (const item of ssInfos._source.references) {
    if (item.name === JSON.parse(metaData.searchSourceJSON).indexRefName) {
      // Get index-pattern information
      const indexPattern = await callCluster(
        client,
        'get',
        {
          index: '.kibana',
          id: 'index-pattern:' + item.id,
        },
        isScheduledTask
      );
      resIndexPattern = indexPattern._source['index-pattern'];
      metaData.paternName = resIndexPattern.title;
      (metaData.timeFieldName = resIndexPattern.timeFieldName),
        (metaData.fields = resIndexPattern.fields); // Get all fields
      // Getting fields of type Date
      const dateFields = [];
      for (const item of JSON.parse(metaData.fields)) {
        if (item.type === 'date') {
          dateFields.push(item.name);
        }
      }
      metaData.dateFields = dateFields;
    }
  }
}

/**
 * Generate CSV and XLSX data by query and convert OpenSearch data set.
 * @param client  OpenSearch client
 * @param limit   limit size of result data set
 */
async function generateReportData(
  client: ILegacyClusterClient | ILegacyScopedClusterClient,
  params: any,
  dateFormat: string,
  csvSeparator: string,
  allowLeadingWildcards: boolean,
  isScheduledTask: boolean,
  logger: Logger,
  timezone: string
) {
  let opensearchData: any = {};
  const arrayHits: any = [];
  const report = { _source: metaData };
  const indexPattern: string = report._source.paternName;
  const maxResultSize: number = await getMaxResultSize();
  const opensearchCount = await getOpenSearchDataSize();

  const total = Math.min(opensearchCount.count, params.limit);
  if (total === 0) {
    return '';
  }

  const reqBody = buildRequestBody(report, allowLeadingWildcards, 0);
  logger.info(
    `[Reporting ${params.report_format} module] DSL request body: ${JSON.stringify(reqBody)}`
  );
  if (total > maxResultSize) {
    await getOpenSearchDataByScroll();
  } else {
    await getOpenSearchDataBySearch();
  }

  if (params.report_format == FORMAT.xlsx) {
    return convertOpenSearchDataToExcel();
  }

  return convertOpenSearchDataToCsv();

  // Fetch OpenSearch query max size windows to decide search or scroll
  async function getMaxResultSize() {
    const settings = await callCluster(
      client,
      'indices.getSettings',
      {
        index: indexPattern,
        includeDefaults: true,
      },
      isScheduledTask
    );

    let maxResultSize = Number.MAX_SAFE_INTEGER;
    for (let indexName in settings) {
      // The location of max result window differs if default overridden.
      maxResultSize = Math.min(
        maxResultSize,
        settings[indexName].settings.index.max_result_window ||
          settings[indexName].defaults.index.max_result_window
      );
    }
    return maxResultSize;
  }

  // Build the OpenSearch Count query to count the size of result
  async function getOpenSearchDataSize() {
    const countReq = buildRequestBody(report, allowLeadingWildcards, 1);
    return await callCluster(
      client,
      'count',
      {
        index: indexPattern,
        body: countReq,
      },
      isScheduledTask
    );
  }

  async function getOpenSearchDataByScroll() {
    const searchParams: RequestParams.Search = {
      index: report._source.paternName,
      scroll: scrollTimeout,
      body: reqBody,
      size: maxResultSize,
    };
    // Open scroll context by fetching first batch
    opensearchData = await callCluster(
      client,
      'search',
      searchParams,
      isScheduledTask
    );
    arrayHits.push(opensearchData.hits);

    // Start scrolling till the end
    const nbScroll = Math.floor(total / maxResultSize);
    for (let i = 0; i < nbScroll; i++) {
      const resScroll = await callCluster(
        client,
        'scroll',
        {
          scrollId: opensearchData._scroll_id,
          scroll: scrollTimeout,
        },
        isScheduledTask
      );
      if (Object.keys(resScroll.hits.hits).length > 0) {
        arrayHits.push(resScroll.hits);
      }
    }

    // Clear scroll context
    await callCluster(
      client,
      'clearScroll',
      {
        scrollId: opensearchData._scroll_id,
      },
      isScheduledTask
    );
  }

  async function getOpenSearchDataBySearch() {
    const searchParams: RequestParams.Search = {
      index: report._source.paternName,
      body: reqBody,
      size: total,
    };

    opensearchData = await callCluster(
      client,
      'search',
      searchParams,
      isScheduledTask
    );

    arrayHits.push(opensearchData.hits);
  }

  // Parse OpenSearch data and convert to CSV
  async function convertOpenSearchDataToCsv() {
    const dataset: any = [];
    dataset.push(getOpenSearchData(arrayHits, report, params, dateFormat, timezone));
    return await convertToCSV(dataset, csvSeparator);
  }

  async function convertOpenSearchDataToExcel() {
    const dataset = [];
    dataset.push(getOpenSearchData(arrayHits, report, params, dateFormat, timezone));

    return await convertToExcel(dataset);
  }
}
