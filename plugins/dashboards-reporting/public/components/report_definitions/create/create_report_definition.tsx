/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiButton,
  EuiTitle,
  EuiPageBody,
  EuiSpacer,
} from '@elastic/eui';
import { ReportSettings } from '../report_settings';
import { generateReportFromDefinitionId } from '../../main/main_utils';
import { converter } from '../utils';
import {
  permissionsMissingToast,
  permissionsMissingActions,
} from '../../utils/utils';
import { definitionInputValidation } from '../utils/utils';

interface reportParamsType {
  report_name: string;
  report_source: string;
  description: string;
  core_params: visualReportParams | dataReportParams;
}
interface visualReportParams {
  base_url: string;
  report_format: string;
  header: string;
  footer: string;
  time_duration: string;
}

interface dataReportParams {
  saved_search_id: number;
  base_url: string;
  report_format: string;
  time_duration: string;
}
interface triggerType {
  trigger_type: string;
  trigger_params?: any;
}

interface deliveryType {
  configIds: Array<string>;
  title: string;
  textDescription: string;
  htmlDescription: string;
}

export interface TriggerParamsType {
  schedule_type: string;
  schedule: Recurring | Cron;
  enabled_time: number;
  enabled: boolean;
}

interface Recurring {
  interval: {
    period: number;
    unit: string;
    start_time: number;
  };
}

interface Cron {
  cron: {
    cron_expression: string;
    time_zone: string;
  };
}

export interface reportDefinitionParams {
  report_params: reportParamsType;
  delivery: deliveryType;
  trigger: triggerType;
}

export interface timeRangeParams {
  timeFrom: Date;
  timeTo: Date;
}

export function CreateReport(props: { [x: string]: any; setBreadcrumbs?: any; httpClient?: any; }) {
  let createReportDefinitionRequest: reportDefinitionParams = {
    report_params: {
      report_name: '',
      report_source: '',
      description: '',
      core_params: {
        base_url: '',
        report_format: '',
        time_duration: '',
      },
    },
    delivery: {
      configIds: [],
      title: '',
      textDescription: '',
      htmlDescription: ''
    },
    trigger: {
      trigger_type: '',
    },
  };

  const [toasts, setToasts] = useState([]);
  const [comingFromError, setComingFromError] = useState(false);
  const [preErrorData, setPreErrorData] = useState({});

  const [
    showSettingsReportNameError,
    setShowSettingsReportNameError,
  ] = useState(false);
  const [
    settingsReportNameErrorMessage,
    setSettingsReportNameErrorMessage,
  ] = useState('');
  const [
    showSettingsReportSourceError,
    setShowSettingsReportSourceError,
  ] = useState(false);
  const [
    settingsReportSourceErrorMessage,
    setSettingsReportSourceErrorMessage,
  ] = useState('');
  const [
    showTriggerIntervalNaNError,
    setShowTriggerIntervalNaNError,
  ] = useState(false);
  const [showCronError, setShowCronError] = useState(false);
  const [showTimeRangeError, setShowTimeRangeError] = useState(false);

  // preserve the state of the request after an invalid create report definition request
  if (comingFromError) {
    createReportDefinitionRequest = preErrorData;
  }

  const addInputValidationErrorToastHandler = () => {
    const errorToast = {
      title: i18n.translate(
        'opensearch.reports.createReportDefinition.error.fieldsHaveAnError',
        {
          defaultMessage:
            'One or more fields have an error. Please check and try again.',
        }
      ),
      color: 'danger',
      iconType: 'alert',
      id: 'errorToast',
    };
    // @ts-ignore
    setToasts(toasts.concat(errorToast));
  };

  const handleInputValidationErrorToast = () => {
    addInputValidationErrorToastHandler();
  };

  const addErrorOnCreateToastHandler = (errorType: string) => {
    let toast = {};
    if (errorType === 'permissions') {
      toast = permissionsMissingToast(
        permissionsMissingActions.CREATING_REPORT_DEFINITION
      );
    } else if (errorType === 'API') {
      toast = {
        title: i18n.translate(
          'opensearch.reports.createReportDefinition.error.errorCreating',
          { defaultMessage: 'Error creating report definition.' }
        ),
        color: 'danger',
        iconType: 'alert',
        id: 'errorToast',
      };
    }
    // @ts-ignore
    setToasts(toasts.concat(toast));
  };

  const handleErrorOnCreateToast = (errorType: string) => {
    addErrorOnCreateToastHandler(errorType);
  };

  const addInvalidTimeRangeToastHandler = () => {
    const errorToast = {
      title: i18n.translate(
        'opensearch.reports.createReportDefinition.error.invalidTimeRange',
        { defaultMessage: 'Invalid time range selected.' }
      ),
      color: 'danger',
      iconType: 'alert',
      id: 'timeRangeErrorToast',
    };
    // @ts-ignore
    setToasts(toasts.concat(errorToast));
  };

  const handleInvalidTimeRangeToast = () => {
    addInvalidTimeRangeToastHandler();
  };

  const removeToast = (removedToast: { id: string; }) => {
    setToasts(toasts.filter((toast: any) => toast.id !== removedToast.id));
  };

  let timeRange = {
    timeFrom: new Date(),
    timeTo: new Date(),
  };

  const createNewReportDefinition = async (
    metadata: reportDefinitionParams,
    timeRange: timeRangeParams
  ) => {
    const { httpClient } = props;
    //TODO: need better handle
    if (
      metadata.trigger.trigger_type === 'On demand' &&
      metadata.trigger.trigger_params !== undefined
    ) {
      delete metadata.trigger.trigger_params;
    }

    let error = false;
    await definitionInputValidation(
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
    ).then((response) => {
      error = response;
    });
    if (error) {
      handleInputValidationErrorToast();
      setPreErrorData(metadata);
      setComingFromError(true);
    } else {
      httpClient
        .post('../api/reporting/reportDefinition', {
          body: JSON.stringify(metadata),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(async (resp: { scheduler_response: { reportDefinitionId: string; }; }) => {
          //TODO: consider handle the on demand report generation from server side instead
          if (metadata.trigger.trigger_type === 'On demand') {
            const reportDefinitionId =
              resp.scheduler_response.reportDefinitionId;
            generateReportFromDefinitionId(reportDefinitionId, httpClient);
          }
          window.location.assign(`reports-dashboards#/create=success`);
        })
        .catch((error: {body: { statusCode: number; }; }) => {
          console.log('error in creating report definition: ' + error);
          if (error.body.statusCode === 403) {
            handleErrorOnCreateToast('permissions');
          } else {
            handleErrorOnCreateToast('API');
          }
        });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    props.setBreadcrumbs([
      {
        text: i18n.translate(
          'opensearch.reports.createReportDefinition.breadcrumb.reporting',
          { defaultMessage: 'Reporting' }
        ),
        href: '#',
      },
      {
        text: i18n.translate(
          'opensearch.reports.createReportDefinition.breadcrumb.createReportDefinition',
          { defaultMessage: 'Create report definition' }
        ),
        href: '#/create',
      },
    ]);
  }, []);

  return (
    <div>
      <EuiPageBody>
        <EuiTitle>
          <h1>
            {i18n.translate('opensearch.reports.createReportDefinition.title', {
              defaultMessage: 'Create report definition',
            })}
          </h1>
        </EuiTitle>
        <EuiSpacer />
        <ReportSettings
          edit={false}
          editDefinitionId={''} // empty string since we are coming from create
          reportDefinitionRequest={createReportDefinitionRequest}
          httpClientProps={props['httpClient']}
          timeRange={timeRange}
          showSettingsReportNameError={showSettingsReportNameError}
          settingsReportNameErrorMessage={settingsReportNameErrorMessage}
          showSettingsReportSourceError={showSettingsReportSourceError}
          settingsReportSourceErrorMessage={settingsReportSourceErrorMessage}
          showTimeRangeError={showTimeRangeError}
          showTriggerIntervalNaNError={showTriggerIntervalNaNError}
          showCronError={showCronError}
        />
        <EuiSpacer />
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              onClick={() => {
                window.location.assign(`reports-dashboards#/`);
              }}
            >
              {i18n.translate(
                'opensearch.reports.createReportDefinition.cancel',
                { defaultMessage: 'Cancel' }
              )}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill={true}
              onClick={() =>
                createNewReportDefinition(
                  createReportDefinitionRequest,
                  timeRange
                )
              }
              id={'createNewReportDefinition'}
            >
              {i18n.translate(
                'opensearch.reports.createReportDefinition.create',
                { defaultMessage: 'Create' }
              )}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiGlobalToastList
          toasts={toasts}
          dismissToast={removeToast}
          toastLifeTimeMs={6000}
        />
      </EuiPageBody>
    </div>
  );
}
