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
    href: webDocumentationLink('user-manual/manager/automatic-reports.html')
  },
  {
    text: 'Reports reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/reports.html')
  }
];

const mainSettings = [
  { field: 'title', label: 'Report name' },
  { field: 'mail_to', label: 'Send report to this email addresses' },
  { field: 'showlogs', label: 'Include logs when creating a report' },
  { field: 'group', label: 'Filter by this group' },
  { field: 'category', label: 'Filter by this category' },
  { field: 'rule', label: 'Filter by this rule ID' },
  { field: 'level', label: 'Filter by this alert level and above' },
  { field: 'location', label: 'Filter by this log location' },
  { field: 'srcip', label: 'Filter by this source IP address' },
  { field: 'user', label: 'Filter by this user name' }
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
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['monitor-reports']) && (
            <WzNoConfig error="Wazuh not ready yet" help={helpLinks} />
          )}
        {currentConfig['monitor-reports'] &&
          !isString(currentConfig['monitor-reports']) &&
          currentConfig['monitor-reports'].reports &&
          currentConfig['monitor-reports'].reports.length && (
            <WzConfigurationSettingsTabSelector
              title="Main settings"
              description="Daily reports about alerts"
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
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

WzConfigurationAlertsReports.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};

export default connect(mapStateToProps)(WzConfigurationAlertsReports);
