/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFormRow, EuiSelect } from '@elastic/eui';
import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { TIMEZONE_OPTIONS } from './report_trigger_constants';

export function TimezoneSelect(props: { reportDefinitionRequest: any; httpClientProps: any; edit: any; editDefinitionId: any; }) {
  const {
    reportDefinitionRequest,
    httpClientProps,
    edit,
    editDefinitionId,
  } = props;
  const [timezone, setTimezone] = useState(TIMEZONE_OPTIONS[0].value);

  const handleTimezone = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setTimezone(e.target.value);
    if (
      reportDefinitionRequest.trigger.trigger_params.schedule_type ===
      'Cron based'
    ) {
      reportDefinitionRequest.trigger.trigger_params.schedule.cron.timezone =
        e.target.value;
    }
  };

  useEffect(() => {
    let unmounted = false;
    if (edit) {
      httpClientProps
        .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
        .then(async (response) => {
          if (
            !unmounted &&
            reportDefinitionRequest.trigger.trigger_params.schedule_type ===
              'Cron based'
          ) {
            setTimezone(
              response.report_definition.trigger.trigger_params.schedule.cron
                .timezone
            );
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
        label={i18n.translate('opensearch.reports.reportTrigger.timezone', {
          defaultMessage: 'Timezone',
        })}
      >
        <EuiSelect
          id="setTimezone"
          options={TIMEZONE_OPTIONS}
          value={timezone}
          onChange={handleTimezone}
        />
      </EuiFormRow>
    </div>
  );
}
