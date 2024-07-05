/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFormRow,
  EuiPageHeader,
  EuiTitle,
  EuiPageContent,
  EuiPageContentBody,
  EuiHorizontalRule,
  EuiSpacer,
  EuiCheckbox,
  EuiComboBox,
  EuiFieldText,
  EuiButton,
} from '@elastic/eui';
import CSS from 'csstype';
import {
  getChannelsQueryObject,
  noDeliveryChannelsSelectedMessage,
  testMessageConfirmationMessage,
  testMessageFailureMessage,
} from './delivery_constants';
import 'react-mde/lib/styles/css/react-mde-all.css';
import { reportDefinitionParams } from '../create/create_report_definition';
import ReactMDE from 'react-mde';
import { converter } from '../utils';
import { getAvailableNotificationsChannels } from '../../main/main_utils';
import { REPORTING_NOTIFICATIONS_DASHBOARDS_API } from '../../../../common';

const styles: CSS.Properties = {
  maxWidth: '800px',
};

// TODO: add to schema to avoid need for export
export let includeDelivery = false;

export type ReportDeliveryProps = {
  edit: boolean;
  editDefinitionId: string;
  reportDefinitionRequest: reportDefinitionParams;
  httpClientProps: any;
  showDeliveryChannelError: boolean;
  deliveryChannelError: string;
  showDeliverySubjectError: boolean;
  deliverySubjectError: string;
  showDeliveryTextError: boolean;
  deliveryTextError: string;
};

export function ReportDelivery(props: ReportDeliveryProps) {
  const {
    edit,
    editDefinitionId,
    reportDefinitionRequest,
    httpClientProps,
    showDeliveryChannelError,
    deliveryChannelError,
    showDeliverySubjectError,
    deliverySubjectError,
    showDeliveryTextError,
    deliveryTextError,
  } = props;

  const [isDeliveryHidden, setIsHidden] = useState(false);
  const [sendNotification, setSendNotification] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [notificationSubject, setNotificationSubject] = useState('New report');
  const [notificationMessage, setNotificationMessage] = useState(
    'New report available to view'
  );
  const [selectedTab, setSelectedTab] = React.useState<'write' | 'preview'>(
    'write'
  );
  const [testMessageConfirmation, setTestMessageConfirmation] = useState('');

  const handleSendNotification = (e: { target: { checked: boolean } }) => {
    setSendNotification(e.target.checked);
    includeDelivery = e.target.checked;
    if (includeDelivery) {
      reportDefinitionRequest.delivery.title = 'New report';
      reportDefinitionRequest.delivery.textDescription =
        'New report available to view';
      reportDefinitionRequest.delivery.htmlDescription = converter.makeHtml(
        'New report available to view'
      );
    } else {
      reportDefinitionRequest.delivery.title = `\u2014`;
      reportDefinitionRequest.delivery.textDescription = `\u2014`;
    }
  };

  const handleSelectedChannels = (e: Array<{ label: string; id: string }>) => {
    setSelectedChannels(e);
    reportDefinitionRequest.delivery.configIds = [];
    for (let i = 0; i < e.length; ++i) {
      reportDefinitionRequest.delivery.configIds.push(e[i].id);
    }
  };

  const handleNotificationSubject = (e: { target: { value: string } }) => {
    setNotificationSubject(e.target.value);
    reportDefinitionRequest.delivery.title = e.target.value;
  };

  const handleNotificationMessage = (e: string) => {
    setNotificationMessage(e);
    reportDefinitionRequest.delivery.textDescription = e.toString();
    reportDefinitionRequest.delivery.htmlDescription = converter.makeHtml(
      e.toString()
    );
  };

  const handleTestMessageConfirmation = (e: JSX.Element) => {
    setTestMessageConfirmation(e);
  };

  const defaultCreateDeliveryParams = () => {
    includeDelivery = false;
    reportDefinitionRequest.delivery = {
      configIds: [],
      title: `\u2014`, // default values before any Notifications settings are configured
      textDescription: `\u2014`,
      htmlDescription: '',
    };
  };

  const isStatusCodeSuccess = (statusCode: string) => {
    if (!statusCode) return true;
    return /^2\d\d/.test(statusCode);
  };

  const eventToNotification = (event: any) => {
    const success = event.event.status_list.every((status: any) =>
      isStatusCodeSuccess(status.delivery_status.status_code)
    );
    return {
      event_source: event.event.event_source,
      status_list: event.event.status_list,
      event_id: event.event_id,
      created_time_ms: event.created_time_ms,
      last_updated_time_ms: event.last_updated_time_ms,
      success,
    };
  };

  const getNotification = async (id: string) => {
    const response = await httpClientProps.get(
      `${REPORTING_NOTIFICATIONS_DASHBOARDS_API.GET_EVENT}/${id}`
    );
    return eventToNotification(response.event_list[0]);
  };

  const sendTestNotificationsMessage = async () => {
    if (selectedChannels.length === 0) {
      handleTestMessageConfirmation(noDeliveryChannelsSelectedMessage);
    }
    let testMessageFailures = false;
    let failedChannels: string[] = [];
    // for each config ID in the current channels list
    for (let i = 0; i < selectedChannels.length; ++i) {
      try {
        const eventId = await httpClientProps
          .get(
            `${REPORTING_NOTIFICATIONS_DASHBOARDS_API.SEND_TEST_MESSAGE}/${selectedChannels[i].id}`,
            {
              query: { feature: 'report' },
            }
          )
          .then((response) => response.event_source.reference_id);
      } catch (error) {
        testMessageFailures = true;
      }
    }
    if (testMessageFailures) {
      handleTestMessageConfirmation(testMessageFailureMessage(failedChannels));
    } else {
      handleTestMessageConfirmation(testMessageConfirmationMessage);
    }
  };

  const checkIfNotificationsPluginIsInstalled = () => {
    fetch(
      '../api/console/proxy?path=%2F_cat%2Fplugins%3Fv%3Dtrue%26s%3Dcomponent%26h%3Dcomponent&method=GET',
      {
        credentials: 'include',
        headers: {
          Accept: 'text/plain, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.5',
          'osd-xsrf': 'true',
        },
        method: 'POST',
        mode: 'cors',
      }
    )
      .then((response) => {
        return response.text();
      })
      .then(function (data) {
        if (data.includes('opensearch-notifications')) {
          setIsHidden(false);
          return;
        }
        setIsHidden(true);
      });
  };

  useEffect(() => {
    checkIfNotificationsPluginIsInstalled();
    httpClientProps
      .get(`${REPORTING_NOTIFICATIONS_DASHBOARDS_API.GET_CONFIGS}`, {
        query: getChannelsQueryObject,
      })
      .then(async (response: any) => {
        let availableChannels = getAvailableNotificationsChannels(
          response.config_list
        );
        setChannels(availableChannels);
        return availableChannels;
      })
      .then((availableChannels: any) => {
        if (edit) {
          httpClientProps
            .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
            .then(async (response: any) => {
              if (response.report_definition.delivery.configIds.length > 0) {
                // add config IDs
                handleSendNotification({ target: { checked: true } });
                let delivery = response.report_definition.delivery;
                let editChannelOptions = [];
                for (let i = 0; i < delivery.configIds.length; ++i) {
                  for (let j = 0; j < availableChannels.length; ++j) {
                    if (delivery.configIds[i] === availableChannels[j].id) {
                      let editChannelOption = {
                        label: availableChannels[j].label,
                        id: availableChannels[j].id,
                      };
                      editChannelOptions.push(editChannelOption);
                      break;
                    }
                  }
                }
                setSelectedChannels(editChannelOptions);
                setNotificationSubject(delivery.title);
                setNotificationMessage(delivery.textDescription);
                reportDefinitionRequest.delivery = delivery;
              }
            });
        } else {
          defaultCreateDeliveryParams();
        }
      })
      .catch((error: string) => {
        console.log(
          'error: cannot get available channels from Notifications plugin:',
          error
        );
      });
  }, []);

  const showNotificationsBody = sendNotification ? (
    <div>
      <EuiSpacer />
      <EuiFormRow
        label="Channels"
        isInvalid={showDeliveryChannelError}
        error={deliveryChannelError}
      >
        <EuiComboBox
          id="notificationsChannelSelect"
          placeholder={'Select channels'}
          options={channels}
          selectedOptions={selectedChannels}
          onChange={handleSelectedChannels}
          isClearable={true}
        />
      </EuiFormRow>
      <EuiSpacer />
      <EuiFormRow
        label="Notification subject"
        helpText="Required if at least one channel type is Email."
        isInvalid={showDeliverySubjectError}
        error={deliverySubjectError}
        style={styles}
      >
        <EuiFieldText
          placeholder={'Enter notification message subject'}
          fullWidth={true}
          value={notificationSubject}
          onChange={handleNotificationSubject}
        />
      </EuiFormRow>
      <EuiSpacer />
      <EuiFormRow
        label="Notification message"
        helpText="Embed variables in your message using Markdown."
        isInvalid={showDeliveryTextError}
        error={deliveryTextError}
        style={styles}
      >
        <ReactMDE
          value={notificationMessage}
          onChange={handleNotificationMessage}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          toolbarCommands={[
            ['header', 'bold', 'italic', 'strikethrough'],
            ['unordered-list', 'ordered-list', 'checked-list'],
          ]}
          generateMarkdownPreview={(markdown) =>
            Promise.resolve(converter.makeHtml(markdown))
          }
        />
      </EuiFormRow>
      <EuiSpacer />
      <EuiFormRow helpText={testMessageConfirmation} fullWidth={true}>
        <EuiButton onClick={sendTestNotificationsMessage}>
          Send test message
        </EuiButton>
      </EuiFormRow>
    </div>
  ) : null;

  return (
    <EuiPageContent panelPaddingSize={'l'} hidden={isDeliveryHidden}>
      <EuiPageHeader>
        <EuiTitle>
          <h2>Notification settings</h2>
        </EuiTitle>
      </EuiPageHeader>
      <EuiHorizontalRule />
      <EuiPageContentBody>
        <EuiCheckbox
          id="notificationsDeliveryCheckbox"
          label="Send notification when report is available"
          checked={sendNotification}
          onChange={handleSendNotification}
        />
        {showNotificationsBody}
      </EuiPageContentBody>
    </EuiPageContent>
  );
}
