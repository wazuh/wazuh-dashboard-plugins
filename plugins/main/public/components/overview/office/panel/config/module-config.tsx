/*
 * Wazuh app - Office 365 ModuleConfig.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { OfficeBody, OfficeDrilldown } from '../views';
import {
  MainViewConfig,
  drilldownIPConfig,
  drilldownUserConfig,
  drilldownOperationsConfig,
  drilldownRulesConfig,
} from './';

/**
 * The length method has to count plugin platform Visualizations for TabVisualizations class
 */
export const ModuleConfig = {
  main: {
    component: props => (
      <OfficeBody {...{ ...MainViewConfig(props), ...props }} />
    ),
  },
  'user.name': {
    component: props => (
      <OfficeDrilldown
        title={i18n.translate('wazuh.office365.drilldown.userActivityTitle', {
          defaultMessage: 'User Activity',
        })}
        {...{ ...drilldownUserConfig(props), ...props }}
      />
    ),
  },
  'client.ip': {
    component: props => (
      <OfficeDrilldown
        title={i18n.translate(
          'wazuh.office365.drilldown.clientIpAddressTitle',
          {
            defaultMessage: 'Client IP address',
          },
        )}
        {...{ ...drilldownIPConfig(props), ...props }}
      />
    ),
  },
  'event.action': {
    component: props => (
      <OfficeDrilldown
        title={i18n.translate('wazuh.office365.drilldown.operationTitle', {
          defaultMessage: 'Operation',
        })}
        {...{ ...drilldownOperationsConfig(props), ...props }}
      />
    ),
  },
  'event.type': {
    component: props => (
      <OfficeDrilldown
        title={i18n.translate('wazuh.office365.drilldown.eventTypeTitle', {
          defaultMessage: 'Event Type',
        })}
        {...{ ...drilldownRulesConfig(props), ...props }}
      />
    ),
  },
};
