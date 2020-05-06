/*
 * Wazuh app - React component for show configuration of alerts - email alerts tab.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import { EuiSpacer } from '@elastic/eui';

import WzConfigurationSetting from '../util-components/configuration-setting';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import WzNoConfig from '../util-components/no-config';
import { isString, isArray } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';

import { connect } from 'react-redux';

const mainSettings = [
  { field: 'email_to', label: 'Send alerts to this email address' },
  {
    field: 'level',
    label: 'Minimum severity level to send the alert by email'
  },
  {
    field: 'group',
    label: 'Send only alerts that belong to one of these groups'
  },
  {
    field: 'event_location',
    label: 'Send alerts when they match this event location'
  },
  { field: 'format', label: 'Format for email alerts' },
  {
    field: 'rule_id',
    label: 'Send only alerts that belong to one of these rule IDs'
  },
  { field: 'do_not_delay', label: 'Disable delayed email delivery' },
  {
    field: 'do_not_group',
    label: 'Disable alerts grouping into the same email'
  }
];

const helpLinks = [
  {
    text: 'How to configure email alerts',
    href:
      'https://documentation.wazuh.com/current/user-manual/manager/manual-email-report/index.html'
  },
  {
    text: 'How to configure authenticated SMTP server',
    href:
      'https://documentation.wazuh.com/current/user-manual/manager/manual-email-report/smtp_authentication.html'
  },
  {
    text: 'Email alerts reference',
    href:
      'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/email_alerts.html'
  }
];

class WzConfigurationAlertsEmailAlerts extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const items =
      currentConfig &&
      currentConfig['mail-alerts'] &&
      isArray(currentConfig['mail-alerts'].email_alerts)
        ? settingsListBuilder(
            currentConfig['mail-alerts'].email_alerts,
            'email_to'
          )
        : [];
    return (
      <Fragment>
        {currentConfig['mail-alerts'] &&
          isString(currentConfig['mail-alerts']) && (
            <WzNoConfig error={currentConfig['mail-alerts']} help={helpLinks} />
          )}
        {currentConfig['mail-alerts'] &&
        !isString(currentConfig['mail-alerts']) &&
        (!currentConfig['mail-alerts'].email_alerts ||
          !currentConfig['mail-alerts'].email_alerts.length) ? (
          <WzNoConfig error="not-present" help={helpLinks} />
        ) : null}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['mail-alerts']) && (
            <WzNoConfig error="Wazuh not ready yet" help={helpLinks} />
          )}
        {currentConfig['mail-alerts'] &&
        isArray(currentConfig['mail-alerts'].email_alerts) &&
        currentConfig['mail-alerts'].email_alerts.length ? (
          <WzConfigurationSettingsTabSelector
            title="Main settings"
            description="Granular email alert options"
            currentConfig={currentConfig}
            minusHeight={320}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

WzConfigurationAlertsEmailAlerts.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};

export default connect(mapStateToProps)(WzConfigurationAlertsEmailAlerts);
