/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidCron } from 'cron-validator';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { includeDelivery } from '../delivery/delivery';

export const definitionInputValidation = async (
  metadata,
  error,
  setShowSettingsReportNameError,
  setSettingsReportNameErrorMessage,
  setShowSettingsReportSourceError,
  setSettingsReportSourceErrorMessage,
  setShowTriggerIntervalNaNError,
  timeRange,
  setShowTimeRangeError,
  setShowCronError,
  setShowEmailRecipientsError,
  setEmailRecipientsErrorMessage
) => {
  // check report name
  // allow a-z, A-Z, 0-9, (), [], ',' - and _ and spaces
  let regexp = /^[\w\-\s\(\)\[\]\,\_\-+]+$/;
  if (metadata.report_params.report_name.search(regexp) === -1) {
    setShowSettingsReportNameError(true);
    if (metadata.report_params.report_name === '') {
      setSettingsReportNameErrorMessage('Name must not be empty.');
    } else {
      setSettingsReportNameErrorMessage('Invalid characters in report name.');
    }
    error = true;
  }

  // if recurring by interval and input is not a number
  if (
    metadata.trigger.trigger_type === 'Schedule' &&
    metadata.trigger.trigger_params.schedule_type === 'Recurring'
  ) {
    let interval = parseInt(
      metadata.trigger.trigger_params.schedule.interval.period
    );
    if (isNaN(interval)) {
      setShowTriggerIntervalNaNError(true);
      error = true;
    }
  }

  // if report source is blank
  if (metadata.report_params.core_params.base_url === '') {
    setShowSettingsReportSourceError(true);
    setSettingsReportSourceErrorMessage(
      i18n.translate('opensearch.reports.error.reportSourceMustNotBeEmpty', {
        defaultMessage: 'Report source must not be empty.',
      })
    );
    error = true;
  }

  // if time range is invalid
  const nowDate = new Date(moment.now());
  if (timeRange.timeFrom > timeRange.timeTo || timeRange.timeTo > nowDate) {
    setShowTimeRangeError(true);
    error = true;
  }

  // if cron based and cron input is invalid
  if (
    metadata.trigger.trigger_type === 'Schedule' &&
    metadata.trigger.trigger_params.schedule_type === 'Cron based'
  ) {
    if (
      !isValidCron(metadata.trigger.trigger_params.schedule.cron.expression)
    ) {
      setShowCronError(true);
      error = true;
    }
  }

  // if email delivery
  if (metadata.delivery.delivery_type === 'Channel') {
    // no recipients are listed
    if (metadata.delivery.delivery_params.recipients.length === 0) {
      setShowEmailRecipientsError(true);
      setEmailRecipientsErrorMessage(
        i18n.translate('odfe.reports.error.emailRecipientsListCannotBeEmpty', {
          defaultMessage: 'Email recipients list cannot be empty.',
        })
      );
      error = true;
    }
    // recipients have invalid email addresses: regexp checks format xxxxx@yyyy.zzz
    let emailRegExp = /\S+@\S+\.\S+/;
    let index;
    let recipients = metadata.delivery.delivery_params.recipients;
    for (index = 0; index < recipients.length; ++index) {
      if (recipients[0].search(emailRegExp) === -1) {
        setShowEmailRecipientsError(true);
        setEmailRecipientsErrorMessage(
          i18n.translate('odfe.reports.error.invalidEmailAddresses', {
            defaultMessage: 'Invalid email addresses in recipients list.',
          })
        );
        error = true;
      }
    }
  }
  return error;
};
