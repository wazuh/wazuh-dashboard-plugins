/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChannelSchemaType,
  DeliverySchemaType,
  ReportDefinitionSchemaType,
  ScheduleSchemaType,
  TriggerSchemaType,
} from '../../../model';
import {
  BackendReportDefinitionType,
  BACKEND_DELIVERY_FORMAT,
  BACKEND_REPORT_FORMAT,
  BACKEND_REPORT_SOURCE,
  BACKEND_REPORT_STATE,
  BACKEND_TRIGGER_TYPE,
  DeliveryType,
  REPORT_FORMAT_DICT,
  REPORT_SOURCE_DICT,
  REPORT_STATE_DICT,
} from '../../../model/backendModel';
import {
  DELIVERY_TYPE,
  FORMAT,
  REPORT_STATE,
  REPORT_TYPE,
  SCHEDULE_TYPE,
} from '../constants';

export const uiToBackendReportDefinition = (
  reportDefinition: ReportDefinitionSchemaType
): BackendReportDefinitionType => {
  const {
    report_params: {
      report_name: reportName,
      description,
      report_source: reportSource,
      core_params: {
        base_url: baseUrl,
        time_duration: timeDuration,
        report_format: reportFormat,
        header,
        footer,
        limit,
        origin,
      },
    },
    trigger,
    delivery,
  } = reportDefinition;

  let backendReportDefinition: BackendReportDefinitionType = {
    name: reportName,
    isEnabled: getBackendIsEnabled(trigger),
    source: {
      description: description,
      type: getBackendReportSource(reportSource),
      id: getBackendReportSourceId(baseUrl),
      origin: origin,
    },
    format: {
      duration: timeDuration,
      fileFormat: getBackendReportFormat(reportFormat),
      ...(limit && { limit: limit }),
      ...(header && { header: header }),
      ...(footer && { footer: footer }),
    },
    trigger: getBackendTrigger(trigger),
    ...(getBackendDelivery(delivery) && {
      delivery: getBackendDelivery(delivery),
    }),
  };
  return backendReportDefinition;
};

const getBackendIsEnabled = (trigger: TriggerSchemaType) => {
  let enabled = true;
  if (trigger.trigger_params) {
    enabled = trigger.trigger_params.enabled;
  }
  return enabled;
};

const getBackendDelivery = (
  delivery: DeliverySchemaType
): DeliveryType | undefined => {
  const {
    configIds: configIds,
    title: title,
    textDescription: textDescription,
    htmlDescription: htmlDescription
  } = delivery;
  let res = {
    configIds: configIds,
    title: title,
    textDescription: textDescription,
    htmlDescription: htmlDescription
  }
  return res;
};

const getBackendTrigger = (trigger: TriggerSchemaType) => {
  const { trigger_params: scheduleParams } = trigger;
  const { schedule } = { ...scheduleParams };
  let res = {
    triggerType: scheduleParams
      ? getBackendTriggerType(scheduleParams)
      : BACKEND_TRIGGER_TYPE.onDemand,
    schedule: schedule,
  };
  return res;
};

const getBackendTriggerType = (
  scheduleParams: ScheduleSchemaType
): BACKEND_TRIGGER_TYPE => {
  const { schedule_type: scheduleType } = scheduleParams;
  let res;
  switch (scheduleType) {
    case SCHEDULE_TYPE.cron:
      res = BACKEND_TRIGGER_TYPE.cronSchedule;
      break;
    case SCHEDULE_TYPE.recurring:
      res = BACKEND_TRIGGER_TYPE.intervalSchedule;
      break;
  }
  return res;
};

const getBackendReportFormat = (
  reportFormat: FORMAT
): BACKEND_REPORT_FORMAT => {
  return REPORT_FORMAT_DICT[reportFormat];
};

export const getBackendReportState = (
  reportState: REPORT_STATE
): BACKEND_REPORT_STATE => {
  return REPORT_STATE_DICT[reportState];
};

export const getBackendReportSource = (
  reportSource: REPORT_TYPE
): BACKEND_REPORT_SOURCE => {
  return REPORT_SOURCE_DICT[reportSource];
};
//TODO: tmp solution, we are extracting the id from the baseUrl, e.g. /app/dashboards#/view/<id>
// since currently dashboard/visualization id are not required in the UI model, will add in the future
const getBackendReportSourceId = (baseUrl: string): string => {
  const id = baseUrl.split('/').pop() || '';
  return id;
};
