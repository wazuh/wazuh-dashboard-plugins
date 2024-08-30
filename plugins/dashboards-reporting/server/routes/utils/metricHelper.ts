/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportSchemaType } from 'server/model';
import {
  EntityType,
  CountersNameType,
  CountersType,
  ActionType,
} from './types';
import _ from 'lodash';
import {
  CAPACITY,
  DEFAULT_ROLLING_COUNTER,
  GLOBAL_BASIC_COUNTER,
  INTERVAL,
  WINDOW,
} from './constants';

export const time2CountWin: Map<number, CountersType> = new Map();

export const addToMetric = (
  entity: EntityType,
  action: ActionType,
  counter: CountersNameType,
  reportMetadata?: ReportSchemaType
) => {
  const count = 1;
  // remove outdated key-value pairs
  trim();

  const timeKey = getKey(Date.now());
  const rollingCounters = time2CountWin.get(timeKey);

  time2CountWin.set(
    timeKey,
    updateCounters(
      entity,
      action,
      counter,
      rollingCounters || _.cloneDeep(DEFAULT_ROLLING_COUNTER),
      count,
      reportMetadata
    )
  );
};

export const getMetrics = () => {
  const preTimeKey = getPreKey(Date.now());
  const rollingCounters = time2CountWin.get(preTimeKey);
  const metrics = buildMetrics(rollingCounters);
  return metrics;
};

const trim = () => {
  if (time2CountWin.size > CAPACITY) {
    const currentKey = getKey(Date.now() - WINDOW * 1000);
    time2CountWin.forEach((_value, key, map) => {
      if (key < currentKey) {
        map.delete(key);
      }
    });
  }
};

const getKey = (milliseconds: number) => {
  return Math.floor(milliseconds / 1000 / INTERVAL);
};

const getPreKey = (milliseconds: number) => {
  return getKey(milliseconds) - 1;
};

const isEntity = (arg: string): arg is EntityType => {
  return (
    arg === 'report' || arg === 'report_definition' || arg === 'report_source'
  );
};

const buildMetrics = (rollingCounters: CountersType | undefined) => {
  if (!rollingCounters) {
    rollingCounters = DEFAULT_ROLLING_COUNTER;
  }
  const basicMetrics = _.merge(rollingCounters, GLOBAL_BASIC_COUNTER);
  const overallActionMetrics = {
    request_total: 0,
    request_count: 0,
    success_count: 0,
    failed_request_count_system_error: 0,
    failed_request_count_user_error: 0,
  };
  Object.keys(basicMetrics).forEach((keys) => {
    if (isEntity(keys)) {
      for (const [action, counters] of Object.entries(basicMetrics[keys])) {
        overallActionMetrics.request_count += counters?.count || 0;
        overallActionMetrics.request_total += counters?.total || 0;
        overallActionMetrics.failed_request_count_system_error +=
          counters?.system_error || 0;
        overallActionMetrics.failed_request_count_user_error +=
          counters?.user_error || 0;
      }
    }
  });
  overallActionMetrics.success_count =
    overallActionMetrics.request_count -
    (overallActionMetrics.failed_request_count_system_error +
      overallActionMetrics.failed_request_count_user_error);

  return { ...basicMetrics, ...overallActionMetrics };
};

const updateCounters = (
  entity: EntityType,
  action: ActionType,
  counter: CountersNameType,
  rollingCounter: CountersType,
  count: number,
  reportMetadata?: ReportSchemaType
) => {
  // update usage metrics
  if (reportMetadata) {
    const {
      report_definition: {
        report_params: {
          report_source: source,
          core_params: { report_format: format },
        },
      },
    } = reportMetadata;

    // @ts-ignore
    rollingCounter[source.toLowerCase().replace(' ', '_')][format]['download'][
      counter
    ] += count;
    // update basic counter for total request count
    if (counter === 'count') {
      //@ts-ignore
      GLOBAL_BASIC_COUNTER[source.toLowerCase().replace(' ', '_')][format][
        'download'
      ]['total']++;
    }
  } else {
    // update action metric, per API
    // @ts-ignore
    rollingCounter[entity][action][counter] += count;
    if (counter === 'count') {
      // @ts-ignore
      GLOBAL_BASIC_COUNTER[entity][action]['total']++;
    }
  }
  return rollingCounter;
};
