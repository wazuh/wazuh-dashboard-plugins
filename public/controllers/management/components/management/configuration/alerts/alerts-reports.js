/*
 * Wazuh app - React component for show configuration of alerts - Report tab.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { i18n } from '@kbn/i18n'
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzNoConfig from '../util-components/no-config';
import { isString } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';

import { connect } from 'react-redux';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Generating automatic reports',
    href: webDocumentationLink('user-manual/manager/automatic-reports.html'),
  },
  {
    text: 'Reports reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/reports.html'),
  },
];

const mainSettings = [
  {
    field: 'title',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.reportName',
      {
        defaultMessage: 'Report name',
      },
    ),
  },
  {
    field: 'mail_to',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.addresses',
      {
        defaultMessage: 'Send report to this email addresses',
      },
    ),
  },
  {
    field: 'showlogs',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.creatingReports',
      {
        defaultMessage: 'Include logs when creating a report',
      },
    ),
  },
  {
    field: 'group',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.filterGroup',
      {
        defaultMessage: 'Filter by this group',
      },
    ),
  },
  {
    field: 'category',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.category',
      {
        defaultMessage: 'Filter by this category',
      },
    ),
  },
  {
    field: 'rule',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.ruleid',
      {
        defaultMessage: 'Filter by this rule ID',
      },
    ),
  },
  {
    field: 'level',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.alertAbove',
      {
        defaultMessage: 'Filter by this alert level and above',
      },
    ),
  },
  {
    field: 'location',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.loctionLog',
      {
        defaultMessage: 'Filter by this log location',
      },
    ),
  },
  {
    field: 'srcip',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.ipAddress',
      {
        defaultMessage: 'Filter by this source IP address',
      },
    ),
  },
  {
    field: 'user',
    label: i18n.translate(
      'wazuh.public.controller.management.config.alerts.reports.name',
      {
        defaultMessage: 'Filter by this user name',
      },
    ),
  },
];

class WzConfigurationAlertsReports extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const items =
      currentConfig &&
      currentConfig['monitor-reports'] &&
      currentConfig['monitor-reports'].reports
        ? settingsListBuilder(currentConfig['monitor-reports'].reports, 'title')
        : {};
    return (
      <Fragment>
        {currentConfig['monitor-reports'] &&
          isString(currentConfig['monitor-reports']) && (
            <WzNoConfig
              error={currentConfig['monitor-reports']}
              help={helpLinks}
            />
          )}
        {currentConfig['monitor-reports'] &&
          !isString(currentConfig['monitor-reports']) &&
          (!currentConfig['monitor-reports'].reports ||
            !currentConfig['monitor-reports'].reports.length) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['monitor-reports']) && (
            <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
          )}
        {currentConfig['monitor-reports'] &&
          !isString(currentConfig['monitor-reports']) &&
          currentConfig['monitor-reports'].reports &&
          currentConfig['monitor-reports'].reports.length && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.alerts.reports.mainSetting',
                {
                  defaultMessage: 'Main settings',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.alerts.reports.daily',
                {
                  defaultMessage: 'Daily reports about alerts',
                },
              )}
              minusHeight={320}
              currentConfig={currentConfig}
              helpLinks={helpLinks}
            >
              <WzConfigurationListSelector
                items={items}
                settings={mainSettings}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzConfigurationAlertsReports.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default connect(mapStateToProps)(WzConfigurationAlertsReports);
