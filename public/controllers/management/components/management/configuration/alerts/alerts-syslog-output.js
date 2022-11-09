/*
 * Wazuh app - React component for show alerts - syslog output tab.
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

import { EuiBasicTable } from '@elastic/eui';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import {
  isString,
  renderValueOrAll,
  renderValueOrNo,
  renderValueOrDefault
} from '../utils/utils';

import { connect } from 'react-redux';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Configuring syslog output',
    href: webDocumentationLink('user-manual/manager/manual-syslog-output.html')
  },
  {
    text: 'Syslog output reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/syslog-output.html')
  }
];

const columns = [
  { field: 'server', name: 'Server' },
  { field: 'port', name: 'Port' },
  { field: 'level', name: 'Level' },
  { field: 'format', name: 'Format', render: renderValueOrDefault('default') },
  { field: 'use_fqdn', name: 'FQDN', render: renderValueOrNo },
  { field: 'rule_id', name: 'Rule ID', render: renderValueOrAll },
  { field: 'group', name: 'Group', render: renderValueOrAll },
  { field: 'location', name: 'Location', render: renderValueOrAll }
];
class WzConfigurationAlertsReports extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig['csyslog-csyslog'] &&
          isString(currentConfig['csyslog-csyslog']) && (
            <WzNoConfig
              error={currentConfig['csyslog-csyslog']}
              help={helpLinks}
            />
          )}
        {currentConfig['csyslog-csyslog'] &&
          !isString(currentConfig['csyslog-csyslog']) &&
          (!currentConfig['csyslog-csyslog'].syslog_output ||
            !currentConfig['csyslog-csyslog'].syslog_output.length) && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['csyslog-csyslog']) && (
            <WzNoConfig error="Wazuh not ready yet" help={helpLinks} />
          )}
        {currentConfig['csyslog-csyslog'] &&
          !isString(currentConfig['csyslog-csyslog']) &&
          currentConfig['csyslog-csyslog'].syslog_output &&
          currentConfig['csyslog-csyslog'].syslog_output.length && (
            <WzConfigurationSettingsTabSelector
              title="Main settings"
              description="Output alerts to a syslog server"
              currentConfig={currentConfig}
              minusHeight={320}
              helpLinks={helpLinks}
            >
              <EuiBasicTable
                columns={columns}
                items={currentConfig['csyslog-csyslog'].syslog_output}
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
