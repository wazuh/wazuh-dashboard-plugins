/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment-timezone';
import { i18n } from '@osd/i18n';

export const TRIGGER_TYPE_OPTIONS = [
  {
    id: 'On demand',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.triggerTypeOptions.onDemand',
      { defaultMessage: 'On demand' }
    ),
  },
  {
    id: 'Schedule',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.triggerTypeOptions.schedule',
      { defaultMessage: 'Schedule' }
    ),
  },
];

export const SCHEDULE_TYPE_OPTIONS = [
  {
    id: 'Recurring',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.scheduleTypeOptions.recurring',
      { defaultMessage: 'Recurring' }
    ),
  },
  {
    id: 'Cron based',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.scheduleTypeOptions.cronBased',
      { defaultMessage: 'Cron based' }
    ),
  },
];

export const SCHEDULE_RECURRING_OPTIONS = [
  {
    value: 'daily',
    text: i18n.translate(
      'opensearch.reports.reportTriggerConstants.scheduleRecurringOptions.daily',
      { defaultMessage: 'Daily' }
    ),
  },
  {
    value: 'byInterval',
    text: i18n.translate(
      'opensearch.reports.reportTriggerConstants.scheduleRecurringOptions.byInterval',
      { defaultMessage: 'By interval' }
    ),
  },
  // TODO: disable on UI. Add them back once we support
  //   {
  //     value: 'weekly',
  //     text: 'Weekly',
  //   },
  //   {
  //     value: 'monthly',
  //     text: 'Monthly',
  //   },
];

export const INTERVAL_TIME_PERIODS = [
  {
    value: 'MINUTES',
    text: i18n.translate(
      'opensearch.reports.reportTriggerConstants.intervalTimePeriods.minutes',
      { defaultMessage: 'Minutes' }
    ),
  },
  {
    value: 'HOURS',
    text: i18n.translate(
      'opensearch.reports.reportTriggerConstants.intervalTimePeriods.hours',
      { defaultMessage: 'Hours' }
    ),
  },
  {
    value: 'DAYS',
    text: i18n.translate(
      'opensearch.reports.reportTriggerConstants.intervalTimePeriods.days',
      { defaultMessage: 'Days' }
    ),
  },
];

export const WEEKLY_CHECKBOX_OPTIONS = [
  {
    id: 'monCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.mon',
      { defaultMessage: 'Mon' }
    ),
  },
  {
    id: 'tueCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.tue',
      { defaultMessage: 'Tue' }
    ),
  },
  {
    id: 'wedCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.wed',
      { defaultMessage: 'Wed' }
    ),
  },
  {
    id: 'thuCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.thu',
      { defaultMessage: 'Thu' }
    ),
  },
  {
    id: 'friCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.fri',
      { defaultMessage: 'Fri' }
    ),
  },
  {
    id: 'satCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.sat',
      { defaultMessage: 'Sat' }
    ),
  },
  {
    id: 'sunCheckbox',
    label: i18n.translate(
      'opensearch.reports.reportTriggerConstants.weeklyCheckboxOptions.sun',
      { defaultMessage: 'Sun' }
    ),
  },
];

export const MONTHLY_ON_THE_OPTIONS = [
  {
    value: 'day',
    text: i18n.translate(
      'opensearch.reports.reportTriggerConstants.monthlyOnTheOptions.day',
      { defaultMessage: 'Day' }
    ),
  },
];

export const TIMEZONE_OPTIONS = moment.tz
  .names()
  .map((tz) => ({ value: tz, text: tz }));
