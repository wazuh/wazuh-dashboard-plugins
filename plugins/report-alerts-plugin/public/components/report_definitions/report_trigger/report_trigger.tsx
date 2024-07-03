/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFormRow,
  EuiRadioGroup,
  EuiDatePicker,
  EuiSelect,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiFieldText,
  EuiCheckboxGroup,
  EuiTextArea,
  EuiLink,
  EuiFieldNumber,
} from '@elastic/eui';
import moment, { Moment } from 'moment';
import { reportDefinitionParams } from '../create/create_report_definition';
import {
  SCHEDULE_RECURRING_OPTIONS,
  INTERVAL_TIME_PERIODS,
  WEEKLY_CHECKBOX_OPTIONS,
  MONTHLY_ON_THE_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
  SCHEDULE_TYPE_OPTIONS,
  TIMEZONE_OPTIONS,
} from './report_trigger_constants';
import { TimezoneSelect } from './timezone';

type ReportTriggerProps = {
  edit: boolean;
  editDefinitionId: string;
  reportDefinitionRequest: reportDefinitionParams;
  httpClientProps: any;
  showTriggerIntervalNaNError: boolean;
  showCronError: boolean;
};

export function ReportTrigger(props: ReportTriggerProps) {
  const {
    edit,
    editDefinitionId,
    reportDefinitionRequest,
    httpClientProps,
    showTriggerIntervalNaNError,
    showCronError,
  } = props;

  const [reportTriggerType, setReportTriggerType] = useState(
    TRIGGER_TYPE_OPTIONS[0].id
  );

  const [scheduleType, setScheduleType] = useState(
    SCHEDULE_TYPE_OPTIONS[0].label
  );
  //TODO: should read local timezone and display
  const [scheduleRecurringFrequency, setScheduleRecurringFrequency] = useState(
    'daily'
  );
  const [recurring, setRecurringTime] = useState(moment());

  const [weeklyCheckbox, setWeeklyCheckbox] = useState({
    ['monCheckbox']: true,
  });
  const [monthlySelect, setMonthlySelect] = useState(
    MONTHLY_ON_THE_OPTIONS[0].value
  );

  const handleReportTriggerType = (e: string) => {
    setReportTriggerType(e);
    reportDefinitionRequest.trigger.trigger_type = e;
    if (e === 'On demand') {
      delete reportDefinitionRequest.trigger.trigger_params;
    }
  };

  const handleScheduleType = (e: React.SetStateAction<string>) => {
    setScheduleType(e);
    if (e === SCHEDULE_TYPE_OPTIONS[1].label) {
      delete reportDefinitionRequest.trigger.trigger_params.schedule.interval;
    } else if (e === SCHEDULE_TYPE_OPTIONS[0].label) {
      delete reportDefinitionRequest.trigger.trigger_params.schedule.cron;
    }
  };

  const handleScheduleRecurringFrequency = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setScheduleRecurringFrequency(e.target.value);
    reportDefinitionRequest.trigger.trigger_params.schedule_type =
      e.target.value;
  };

  const handleRecurringTime = (e: React.SetStateAction<moment.Moment>) => {
    setRecurringTime(e);
  };

  const handleWeeklyCheckbox = (e) => {
    const newCheckboxIdToSelectedMap = {
      ...weeklyCheckbox,
      ...{
        [e]: !weeklyCheckbox[e],
      },
    };
    setWeeklyCheckbox(newCheckboxIdToSelectedMap);
  };

  const handleMonthlySelect = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setMonthlySelect(e.target.value);
  };

  const RequestTime = () => {
    useEffect(() => {
      let recurringDaily = {
        interval: {
          period: 1,
          unit: 'DAYS',
          start_time: recurring.valueOf(),
        },
      };
      reportDefinitionRequest.trigger.trigger_params = {
        ...reportDefinitionRequest.trigger.trigger_params,
        enabled_time: recurring.valueOf(),
        schedule: recurringDaily,
      };
    }, []);

    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.form.requestTime',
            { defaultMessage: 'request time' }
          )}
        >
          <EuiDatePicker
            showTimeSelect
            showTimeSelectOnly
            selected={recurring}
            onChange={handleRecurringTime}
            dateFormat="HH:mm"
            timeFormat="HH:mm"
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    );
  };

  const RecurringDaily = () => {
    const [recurringDailyTime, setRecurringDailyTime] = useState(moment());

    const handleRecurringDailyTime = (e) => {
      setRecurringDailyTime(e);
      reportDefinitionRequest.trigger.trigger_params.schedule.interval.start_time = e.valueOf();
    };

    const setDailyParams = () => {
      let recurringDaily = {
        interval: {
          period: 1,
          unit: 'DAYS',
          start_time: recurringDailyTime.valueOf(),
        },
      };
      reportDefinitionRequest.trigger.trigger_params = {
        ...reportDefinitionRequest.trigger.trigger_params,
        enabled_time: recurringDailyTime.valueOf(),
        schedule: recurringDaily,
      };
    };

    const isDailySchedule = (response) => {
      return (
        response.report_definition.trigger.trigger_params.schedule_type ===
          SCHEDULE_TYPE_OPTIONS[0].id &&
        response.report_definition.trigger.trigger_params.schedule.interval
          .period === 1 &&
        response.report_definition.trigger.trigger_params.schedule.interval ===
          'DAYS'
      );
    };

    useEffect(() => {
      let unmounted = false;
      if (edit) {
        httpClientProps
          .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
          .then(async (response) => {
            // if switching from on demand to schedule
            if (
              response.report_definition.trigger.trigger_type === 'On demand'
            ) {
              setDailyParams();
            } else if (isDailySchedule(response)) {
              const date = moment(
                response.report_definition.trigger.trigger_params.schedule
                  .interval.start_time
              );
              if (!unmounted) {
                setRecurringDailyTime(date);
              }
            }
            // if switching from on-demand to schedule
            else if (
              reportDefinitionRequest.trigger.trigger_params.schedule_type ===
              SCHEDULE_TYPE_OPTIONS[0].id
            ) {
              setDailyParams();
            }
          });
      } else {
        setDailyParams();
      }
      return () => {
        unmounted = true;
      };
    }, []);

    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.schedule.requestTime',
            { defaultMessage: 'request time' }
          )}
        >
          <EuiDatePicker
            showTimeSelect
            showTimeSelectOnly
            selected={recurringDailyTime}
            onChange={handleRecurringDailyTime}
            dateFormat="HH:mm"
            timeFormat="HH:mm"
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    );
  };

  const RecurringInterval = () => {
    const [intervalText, setIntervalText] = useState('');
    const [intervalTimePeriod, setIntervalTimePeriod] = useState(
      INTERVAL_TIME_PERIODS[0].value
    );
    const [recurringIntervalTime, setRecurringIntervalTime] = useState(
      moment()
    );

    const handleRecurringIntervalTime = (e) => {
      setRecurringIntervalTime(e);
      reportDefinitionRequest.trigger.trigger_params.schedule.interval.start_time = e.valueOf();
    };

    const handleIntervalText = (e: {
      target: { value: React.SetStateAction<string> };
    }) => {
      setIntervalText(e.target.value);
    };

    const handleIntervalTimePeriod = (e: {
      target: { value: React.SetStateAction<string> };
    }) => {
      setIntervalTimePeriod(e.target.value);
    };

    useEffect(() => {
      let interval = {
        interval: {
          period: parseInt(intervalText, 10),
          unit: intervalTimePeriod,
          start_time: recurringIntervalTime.valueOf(),
        },
      };
      reportDefinitionRequest.trigger.trigger_params = {
        ...reportDefinitionRequest.trigger.trigger_params,
        enabled_time: recurringIntervalTime.valueOf(),
        schedule: interval,
      };
    }, [intervalTimePeriod, intervalText]);

    // second useEffect() only to be triggered before render when on Edit
    useEffect(() => {
      let unmounted = false;
      if (edit) {
        httpClientProps
          .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
          .then(async (response) => {
            if (
              response.report_definition.trigger.trigger_params
                .schedule_type === SCHEDULE_TYPE_OPTIONS[0].id
            ) {
              const date = moment(
                response.report_definition.trigger.trigger_params.schedule
                  .interval.start_time
              );
              if (!unmounted) {
                setRecurringIntervalTime(date);
                setIntervalText(
                  response.report_definition.trigger.trigger_params.schedule.interval.period.toString()
                );
                setIntervalTimePeriod(
                  response.report_definition.trigger.trigger_params.schedule
                    .interval.unit
                );
              }
            }
          });
      }
      return () => {
        unmounted = true;
      };
    }, []);

    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.recurring.every',
            { defaultMessage: 'every' }
          )}
          isInvalid={showTriggerIntervalNaNError}
          error={i18n.translate(
            'opensearch.reports.reportTrigger.recurring.intervalMustBeANumber',
            { defaultMessage: 'Interval must be a number.' }
          )}
        >
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiFieldText
                id="recurringByIntervalNumber"
                placeholder={i18n.translate(
                  'opensearch.reports.reportTrigger.recurring.placeholder.mustBeANumber',
                  { defaultMessage: 'Must be a number' }
                )}
                value={intervalText}
                onChange={handleIntervalText}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFormRow>
                <EuiSelect
                  id="intervalTimeUnit"
                  options={INTERVAL_TIME_PERIODS}
                  value={intervalTimePeriod}
                  onChange={handleIntervalTimePeriod}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.recurring.startTime',
            { defaultMessage: 'start time' }
          )}
        >
          <EuiDatePicker
            showTimeSelect
            showTimeSelectOnly
            selected={recurringIntervalTime}
            onChange={handleRecurringIntervalTime}
            dateFormat="HH:mm"
            timeFormat="HH:mm"
          />
        </EuiFormRow>
      </div>
    );
  };

  const RecurringWeekly = () => {
    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.weekly.every',
            { defaultMessage: 'every' }
          )}
        >
          <EuiCheckboxGroup
            options={WEEKLY_CHECKBOX_OPTIONS}
            idToSelectedMap={weeklyCheckbox}
            onChange={handleWeeklyCheckbox}
          />
        </EuiFormRow>
        <EuiSpacer />
        <RequestTime />
      </div>
    );
  };

  const RecurringMonthly = () => {
    const [monthlyDayNumber, setMonthlyDayNumber] = useState('');

    const handleMonthlyDayNumber = (e: {
      target: { value: React.SetStateAction<string> };
    }) => {
      setMonthlyDayNumber(e.target.value);
    };

    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.monthly.onThe',
            { defaultMessage: 'on the' }
          )}
        >
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiSelect
                id="monthlySelect"
                options={MONTHLY_ON_THE_OPTIONS}
                value={monthlySelect}
                onChange={handleMonthlySelect}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFieldNumber
                placeholder={i18n.translate(
                  'opensearch.reports.reportTrigger.monthly.placeholder.dayOfMonth',
                  { defaultMessage: 'Day of month' }
                )}
                value={monthlyDayNumber}
                onChange={handleMonthlyDayNumber}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
        <EuiSpacer size="s" />
        <RequestTime />
      </div>
    );
  };

  const CronExpression = () => {
    const [cronExpression, setCronExpression] = useState('');

    const handleCronExpression = (e: {
      target: { value: React.SetStateAction<string> };
    }) => {
      setCronExpression(e.target.value);
      reportDefinitionRequest.trigger.trigger_params.schedule.cron.expression =
        e.target.value;
    };

    const setCronParams = () => {
      let cron = {
        cron: {
          expression: '',
          timezone: TIMEZONE_OPTIONS[0].value,
        },
      };
      reportDefinitionRequest.trigger.trigger_params = {
        ...reportDefinitionRequest.trigger.trigger_params,
        enabled_time: Date.now().valueOf(),
        schedule: cron,
      };
    };

    useEffect(() => {
      if (edit) {
        httpClientProps
          .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
          .then(async (response) => {
            // if switching from on demand to schedule
            if (
              response.report_definition.trigger.trigger_type === 'On demand'
            ) {
              setCronParams();
            } else if (
              response.report_definition.trigger.trigger_params
                .schedule_type === SCHEDULE_TYPE_OPTIONS[1].id
            ) {
              setCronExpression(
                response.report_definition.trigger.trigger_params.schedule.cron
                  .expression
              );
            } else {
              setCronParams();
            }
          });
      } else {
        setCronParams();
      }
    }, []);

    return (
      <div>
        <EuiFormRow
          id="cronExpressionFieldText"
          label={i18n.translate(
            'opensearch.reports.reportTrigger.cron.customCronExpression',
            { defaultMessage: 'custom cron expression' }
          )}
          isInvalid={showCronError}
          error={'Invalid cron expression.'}
          labelAppend={
            <EuiText size="xs">
              <EuiLink
                href="https://opensearch.org/docs/monitoring-plugins/alerting/cron/"
                target="_blank"
                external={true}
              >
                Cron help
              </EuiLink>
            </EuiText>
          }
        >
          <EuiFieldText
            id="cronExpressionFieldText"
            placeholder={i18n.translate(
              'opensearch.reports.reportTrigger.cron.placeholder.formula',
              {
                defaultMessage:
                  'Ex: 0 12 * * * (Fire at 12:00 PM (noon) every day)',
              }
            )}
            value={cronExpression}
            onChange={handleCronExpression}
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    );
  };

  const ScheduleTriggerRecurring = () => {
    const display_daily =
      scheduleRecurringFrequency === 'daily' ? <RecurringDaily /> : null;

    const display_interval =
      scheduleRecurringFrequency === 'byInterval' ? (
        <RecurringInterval />
      ) : null;

    const display_weekly =
      scheduleRecurringFrequency === 'weekly' ? <RecurringWeekly /> : null;

    const display_monthly =
      scheduleRecurringFrequency === 'monthly' ? <RecurringMonthly /> : null;

    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.scheduleTriggerRecurring.frequency',
            { defaultMessage: 'frequency' }
          )}
          id="recurringFrequencySelect"
        >
          <EuiSelect
            options={SCHEDULE_RECURRING_OPTIONS}
            value={scheduleRecurringFrequency}
            onChange={handleScheduleRecurringFrequency}
          />
        </EuiFormRow>
        <EuiSpacer />
        {display_daily}
        {display_interval}
        {display_weekly}
        {display_monthly}
      </div>
    );
  };

  const ScheduleTrigger = () => {
    const display_recurring =
      scheduleType === SCHEDULE_TYPE_OPTIONS[0].id ? (
        <ScheduleTriggerRecurring />
      ) : null;

    const display_cron =
      scheduleType === SCHEDULE_TYPE_OPTIONS[1].id ? (
        <div>
          <CronExpression />
          <TimezoneSelect
            reportDefinitionRequest={reportDefinitionRequest}
            httpClientProps={httpClientProps}
            edit={edit}
            editDefinitionId={editDefinitionId}
          />
        </div>
      ) : null;

    useEffect(() => {
      // Set default trigger_type
      SCHEDULE_TYPE_OPTIONS.map((item) => {
        if (item.id === scheduleType) {
          reportDefinitionRequest.trigger.trigger_params = {
            ...reportDefinitionRequest.trigger.trigger_params,
            schedule_type: item.id,
            //TODO: need better handle
          };
          if (!edit) {
            reportDefinitionRequest.trigger.trigger_params.enabled = true;
          }
          if (!('enabled' in reportDefinitionRequest.trigger.trigger_params)) {
            reportDefinitionRequest.trigger.trigger_params.enabled = true;
          }
        }
      });
    }, [scheduleType]);

    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportTrigger.scheduleTrigger.requestTime',
            { defaultMessage: 'request time' }
          )}
        >
          <EuiRadioGroup
            options={SCHEDULE_TYPE_OPTIONS}
            idSelected={scheduleType}
            onChange={handleScheduleType}
          />
        </EuiFormRow>
        <EuiSpacer />
        {display_recurring}
        {display_cron}
      </div>
    );
  };

  const schedule =
    reportTriggerType === 'Schedule' ? <ScheduleTrigger /> : null;

  const defaultEditTriggerType = (trigger_type) => {
    let index = 0;
    for (index; index < TRIGGER_TYPE_OPTIONS.length; ++index) {
      if (TRIGGER_TYPE_OPTIONS[index].id === trigger_type) {
        setReportTriggerType(TRIGGER_TYPE_OPTIONS[index].id);
      }
    }
  };

  const defaultEditRequestType = (trigger) => {
    let index = 0;
    for (index; index < SCHEDULE_TYPE_OPTIONS.length; ++index) {
      if (
        SCHEDULE_TYPE_OPTIONS[index].id === trigger.trigger_params.schedule_type
      ) {
        setScheduleType(SCHEDULE_TYPE_OPTIONS[index].id);
      }
    }
  };

  const defaultEditScheduleFrequency = (trigger_params) => {
    if (trigger_params.schedule_type === SCHEDULE_TYPE_OPTIONS[0].id) {
      if (
        trigger_params.schedule.interval.unit === 'Days' &&
        trigger_params.schedule.interval.period === 1
      ) {
        setScheduleRecurringFrequency('daily');
      } else {
        setScheduleRecurringFrequency('byInterval');
      }
    }
  };

  const defaultConfigurationEdit = (trigger) => {
    defaultEditTriggerType(trigger.trigger_type);
    if (trigger.trigger_type === 'Schedule') {
      defaultEditScheduleFrequency(trigger.trigger_params);
      defaultEditRequestType(trigger);
    } else if (trigger.trigger_type == 'On demand') {
      setReportTriggerType('On demand');
      reportDefinitionRequest.trigger.trigger_type = 'On demand';
    }
  };

  useEffect(() => {
    if (edit) {
      httpClientProps
        .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
        .then(async (response) => {
          defaultConfigurationEdit(response.report_definition.trigger);
          reportDefinitionRequest.trigger = response.report_definition.trigger;
        });
    }
    // Set default trigger_type for create new report definition
    else {
      TRIGGER_TYPE_OPTIONS.map((item) => {
        if (item.id === reportTriggerType) {
          reportDefinitionRequest.trigger.trigger_type = item.id;
        }
      });
    }
  }, []);

  return (
    <div>
      <EuiFormRow
        label={i18n.translate(
        'opensearch.reports.reportTrigger.form.triggerType',
        { defaultMessage: 'Report trigger' }
        )}
        id="reportDefinitionTriggerTypes"
      >
        <EuiRadioGroup
        options={TRIGGER_TYPE_OPTIONS}
        idSelected={reportTriggerType}
        onChange={handleReportTriggerType}
        />
      </EuiFormRow>
      <EuiSpacer />
      {schedule}
    </div>
  );
}
