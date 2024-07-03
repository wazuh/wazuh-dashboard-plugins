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
  EuiButton,
  EuiPage,
  EuiTitle,
  EuiPageBody,
  EuiSpacer,
  EuiGlobalToastList,
} from '@elastic/eui';
import { ReportSettings } from '../report_settings';
import { ReportTrigger } from '../report_trigger';
import { ReportDefinitionSchemaType } from 'server/model';
import { converter } from '../utils';
import {
  permissionsMissingToast,
  permissionsMissingActions,
} from '../../utils/utils';
import { definitionInputValidation } from '../utils/utils';

export function EditReportDefinition(props: {
  [x: string]: any;
  setBreadcrumbs?: any;
  httpClient?: any;
}) {
  const [toasts, setToasts] = useState([]);
  const [comingFromError, setComingFromError] = useState(false);
  const [preErrorData, setPreErrorData] = useState({});

  const [showSettingsReportNameError, setShowSettingsReportNameError] =
    useState(false);
  const [settingsReportNameErrorMessage, setSettingsReportNameErrorMessage] =
    useState('');
  const [showSettingsReportSourceError, setShowSettingsReportSourceError] =
    useState(false);
  const [
    settingsReportSourceErrorMessage,
    setSettingsReportSourceErrorMessage,
  ] = useState('');
  const [showTriggerIntervalNaNError, setShowTriggerIntervalNaNError] =
    useState(false);
  const [showCronError, setShowCronError] = useState(false);
  const [showTimeRangeError, setShowTimeRangeError] = useState(false);

  const addPermissionsMissingViewEditPageToastHandler = (errorType: string) => {
    let toast = {};
    if (errorType === 'permissions') {
      toast = permissionsMissingToast(
        permissionsMissingActions.VIEWING_EDIT_PAGE
      );
    } else if (errorType === 'API') {
      toast = {
        title: i18n.translate(
          'opensearch.reports.editReportDefinition.errorLoading',
          { defaultMessage: 'Error loading report definition values.' }
        ),
        color: 'danger',
        iconType: 'alert',
        id: 'errorToast',
      };
    }
    // @ts-ignore
    setToasts(toasts.concat(toast));
  };

  const handleViewEditPageErrorToast = (errorType: string) => {
    addPermissionsMissingViewEditPageToastHandler(errorType);
  };

  const addInputValidationErrorToastHandler = () => {
    const errorToast = {
      title: i18n.translate(
        'opensearch.reports.editReportDefinition.fieldsHaveAnError',
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

  const addErrorUpdatingReportDefinitionToastHandler = (errorType: string) => {
    let toast = {};
    if (errorType === 'permissions') {
      toast = permissionsMissingToast(
        permissionsMissingActions.UPDATING_DEFINITION
      );
    } else if (errorType === 'API') {
      toast = {
        title: i18n.translate(
          'opensearch.reports.editReportDefinition.errorUpdating',
          { defaultMessage: 'Error updating report definition.' }
        ),
        color: 'danger',
        iconType: 'alert',
        id: 'errorToast',
      };
    }
    // @ts-ignore
    setToasts(toasts.concat(toast));
  };

  const handleErrorUpdatingReportDefinitionToast = (errorType: string) => {
    addErrorUpdatingReportDefinitionToastHandler(errorType);
  };

  const addErrorDeletingReportDefinitionToastHandler = () => {
    const errorToast = {
      title: i18n.translate(
        'opensearch.reports.editReportDefinition.errorDeleting',
        { defaultMessage: 'Error deleting old scheduled report definition.' }
      ),
      color: 'danger',
      iconType: 'alert',
      id: 'errorDeleteToast',
    };
    // @ts-ignore
    setToasts(toasts.concat(errorToast));
  };

  const handleErrorDeletingReportDefinitionToast = () => {
    addErrorDeletingReportDefinitionToastHandler();
  };

  const removeToast = (removedToast: { id: any }) => {
    setToasts(toasts.filter((toast: any) => toast.id !== removedToast.id));
  };

  const reportDefinitionId = props['match']['params']['reportDefinitionId'];
  let reportDefinition: ReportDefinitionSchemaType;
  let editReportDefinitionRequest = {
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
      htmlDescription: '',
    },
    trigger: {
      trigger_type: '',
    },
    time_created: 0,
    last_updated: 0,
    status: '',
  };
  reportDefinition = editReportDefinitionRequest; // initialize reportDefinition object

  let timeRange = {
    timeFrom: new Date(),
    timeTo: new Date(),
  };

  if (comingFromError) {
    editReportDefinitionRequest = preErrorData;
  }

  const callUpdateAPI = async (metadata) => {
    const { httpClient } = props;
    httpClient
      .put(`../api/reporting/reportDefinitions/${reportDefinitionId}`, {
        body: JSON.stringify(metadata),
        params: reportDefinitionId.toString(),
      })
      .then(async () => {
        window.location.assign(`reports-alerts#/edit=success`);
      })
      .catch((error: { body: { statusCode: number } }) => {
        console.log('error in updating report definition:', error);
        if (error.body.statusCode === 400) {
          handleInputValidationErrorToast();
        } else if (error.body.statusCode === 403) {
          handleErrorUpdatingReportDefinitionToast('permissions');
        } else {
          handleErrorUpdatingReportDefinitionToast('API');
        }
        setPreErrorData(metadata);
        setComingFromError(true);
      });
  };

  const editReportDefinition = async (metadata: {
    report_params: { core_params: { header: string; footer: string } };
  }) => {
    if ('header' in metadata.report_params.core_params) {
      metadata.report_params.core_params.header = converter.makeHtml(
        metadata.report_params.core_params.header
      );
    }
    if ('footer' in metadata.report_params.core_params) {
      metadata.report_params.core_params.footer = converter.makeHtml(
        metadata.report_params.core_params.footer
      );
    }

    // client-side input validation
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
      setShowCronError
    ).then((response) => {
      error = response;
    });
    if (error) {
      handleInputValidationErrorToast();
      setPreErrorData(metadata);
      setComingFromError(true);
    } else {
      await callUpdateAPI(metadata);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const { httpClient } = props;
    httpClient
      .get(`../api/reporting/reportDefinitions/${reportDefinitionId}`)
      .then((response) => {
        reportDefinition = response.report_definition;
        const {
          time_created: timeCreated,
          status,
          last_updated: lastUpdated,
          report_params: { report_name: reportName },
        } = reportDefinition;
        // configure non-editable fields
        editReportDefinitionRequest.time_created = timeCreated;
        editReportDefinitionRequest.last_updated = lastUpdated;
        editReportDefinitionRequest.status = status;

        props.setBreadcrumbs([
          {
            text: 'Reporting',
            href: '#',
          },
          {
            text: `Report definition details: ${reportName}`,
            href: `#/report_definition_details/${reportDefinitionId}`,
          },
          {
            text: `Edit report definition: ${reportName}`,
          },
        ]);
      })
      .catch((error: { body: { statusCode: number } }) => {
        console.error(
          'error when loading edit report definition page: ',
          error
        );
        if (error.body.statusCode === 403) {
          handleViewEditPageErrorToast('permissions');
        } else {
          handleViewEditPageErrorToast('API');
        }
      });
  }, []);

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiTitle>
          <h1>
            {i18n.translate('opensearch.reports.editReportDefinition.title', {
              defaultMessage: 'Edit report definition',
            })}
          </h1>
        </EuiTitle>
        <EuiSpacer />
        <ReportSettings
          edit={true}
          editDefinitionId={reportDefinitionId}
          reportDefinitionRequest={editReportDefinitionRequest}
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
                window.location.assign('reports-alerts#/');
              }}
            >
              {i18n.translate(
                'opensearch.reports.editReportDefinition.cancel',
                { defaultMessage: 'Cancel' }
              )}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={() => editReportDefinition(editReportDefinitionRequest)}
              id={'editReportDefinitionButton'}
            >
              {i18n.translate('opensearch.reports.editReportDefinition.save', {
                defaultMessage: 'Save Changes',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiGlobalToastList
          toasts={toasts}
          dismissToast={removeToast}
          toastLifeTimeMs={6000}
        />
      </EuiPageBody>
    </EuiPage>
  );
}
