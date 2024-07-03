/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { EuiIcon, EuiText } from '@elastic/eui'

export const noDeliveryChannelsSelectedMessage = (
  <EuiText size='s'>
    <EuiIcon type='alert'/> Please select a channel. 
  </EuiText>
)

export const testMessageConfirmationMessage = (
  <EuiText size='s'>
    <EuiIcon type='check'/> Test message sent to selected channels. If no test message is received, try again or check your channel settings in Notifications.
  </EuiText>
);

export const testMessageFailureMessage = (failedChannels: Array<string>) => (
  <EuiText size='s'>
    <EuiIcon type='alert'/> Failed to send test message for some channels. Please adjust channel settings for {failedChannels.toString()}
  </EuiText>
)

export const getChannelsQueryObject = {
  config_type: ['slack', 'email', 'chime', 'webhook', 'sns', 'ses'],
  from_index: 0,
  max_items: 1000,
  sort_field: 'name',
  sort_order: 'asc',
  feature_list: ['reports']
}
