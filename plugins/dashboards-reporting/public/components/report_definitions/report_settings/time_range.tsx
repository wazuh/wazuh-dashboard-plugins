/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { parseInContextUrl } from './report_settings_helpers';
import dateMath from '@elastic/datemath';
import {
  EuiFormRow,
  EuiGlobalToastList,
  EuiSuperDatePicker,
} from '@elastic/eui';
import { commonTimeRanges } from './report_settings_constants';

export function TimeRangeSelect(props) {
  const {
    reportDefinitionRequest,
    timeRange,
    edit,
    id,
    httpClientProps,
    showTimeRangeError,
  } = props;

  const [recentlyUsedRanges, setRecentlyUsedRanges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [start, setStart] = useState('now-30m');
  const [end, setEnd] = useState('now');

  const [toasts, setToasts] = useState([]);

  const addInvalidTimeRangeToastHandler = () => {
    const errorToast = {
      title: i18n.translate('opensearch.reports.timeRange.invalidTimeRange', {
        defaultMessage: 'Invalid time range selected.',
      }),
      color: 'danger',
      iconType: 'alert',
      id: 'timeRangeErrorToast',
    };
    setToasts(toasts.concat(errorToast));
  };

  const handleInvalidTimeRangeToast = () => {
    addInvalidTimeRangeToastHandler();
  };

  const removeToast = (removedToast) => {
    setToasts(toasts.filter((toast) => toast.id !== removedToast.id));
  };

  const isValidTimeRange = (
    timeRangeMoment: number | moment.Moment,
    limit: string,
    handleInvalidTimeRangeToast: any
  ) => {
    if (limit === 'start') {
      if (!timeRangeMoment || !timeRangeMoment.isValid()) {
        handleInvalidTimeRangeToast();
      }
    } else if (limit === 'end') {
      if (
        !timeRangeMoment ||
        !timeRangeMoment.isValid() ||
        timeRangeMoment > moment.now()
      ) {
        handleInvalidTimeRangeToast();
      }
    }
  };

  const setDefaultEditTimeRange = (duration, unmounted) => {
    let time_difference = moment.now() - duration;
    const fromDate = new Date(time_difference);
    parseTimeRange(fromDate, end, reportDefinitionRequest);
    if (!unmounted) {
      setStart(fromDate.toISOString());
      setEnd(end);
    }
  };

  // valid time range check for absolute time end date
  const checkValidAbsoluteEndDate = (end) => {
    let endDate = new Date(end);
    let nowDate = new Date(moment.now());
    let valid = true;
    if (endDate.getTime() > nowDate.getTime()) {
      end = 'now';
      valid = false;
    }
    return valid;
  };

  useEffect(() => {
    let unmounted = false;
    // if we are coming from the in-context menu
    if (window.location.href.indexOf('?') > -1) {
      const url = window.location.href;
      const timeFrom = parseInContextUrl(url, 'timeFrom');
      const timeTo = parseInContextUrl(url, 'timeTo');
      parseTimeRange(timeFrom, timeTo, reportDefinitionRequest);
      if (!unmounted) {
        setStart(timeFrom);
        setEnd(timeTo);
      }
    } else {
      if (edit) {
        httpClientProps
          .get(`../api/reporting/reportDefinitions/${id}`)
          .then(async (response: {}) => {
            let duration =
              response.report_definition.report_params.core_params
                .time_duration;
            duration = moment.duration(duration);
            setDefaultEditTimeRange(duration, unmounted);
          })
          .catch((error) => {
            console.error(
              'error in fetching report definition details:',
              error
            );
          });
      } else {
        parseTimeRange(start, end, reportDefinitionRequest);
      }
    }
    return () => {
      unmounted = true;
    };
  }, []);

  const onTimeChange = ({ start, end }) => {
    isValidTimeRange(
      dateMath.parse(start),
      'start',
      handleInvalidTimeRangeToast
    );
    isValidTimeRange(
      dateMath.parse(end, { roundUp: true }),
      'end',
      handleInvalidTimeRangeToast
    );

    const recentlyUsedRange = recentlyUsedRanges.filter((recentlyUsedRange) => {
      const isDuplicate =
        recentlyUsedRange.start === start && recentlyUsedRange.end === end;
      return !isDuplicate;
    });
    const validEndDate = checkValidAbsoluteEndDate(end);
    if (!validEndDate) {
      handleInvalidTimeRangeToast();
      return;
    }

    recentlyUsedRange.unshift({ start, end });
    setStart(start);
    setEnd(end);
    setRecentlyUsedRanges(
      recentlyUsedRange.length > 10
        ? recentlyUsedRange.slice(0, 9)
        : recentlyUsedRange
    );
    setIsLoading(true);
    startLoading();
    parseTimeRange(start, end, reportDefinitionRequest);
  };

  const parseTimeRange = (start, end, reportDefinitionRequest) => {
    timeRange.timeFrom = dateMath.parse(start);
    timeRange.timeTo = dateMath.parse(end);
    const timeDuration = moment.duration(
      dateMath.parse(end).diff(dateMath.parse(start))
    );
    reportDefinitionRequest.report_params.core_params.time_duration = timeDuration.toISOString();
  };

  const startLoading = () => {
    setTimeout(stopLoading, 1000);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <div>
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.timeRange.label.timeRange',
            { defaultMessage: 'Time range' }
          )}
          helpText={i18n.translate(
            'opensearch.reports.timeRange.help.timeRange',
            {
              defaultMessage:
                'Time range is relative to the report creation date on the report trigger.',
            }
          )}
          isInvalid={showTimeRangeError}
          error={i18n.translate(
            'opensearch.reports.timeRange.invalidTimeRange',
            { defaultMessage: 'Invalid time range selected.' }
          )}
        >
          <EuiSuperDatePicker
            isDisabled={false}
            isLoading={isLoading}
            start={start}
            end={end}
            onTimeChange={onTimeChange}
            showUpdateButton={false}
            commonlyUsedRanges={commonTimeRanges}
          />
        </EuiFormRow>
      </div>
      <div>
        <EuiGlobalToastList
          toasts={toasts}
          dismissToast={removeToast}
          toastLifeTimeMs={6000}
        />
      </div>
    </div>
  );
}
