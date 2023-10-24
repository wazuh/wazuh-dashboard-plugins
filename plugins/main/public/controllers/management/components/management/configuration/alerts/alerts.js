/*
 * Wazuh app - React component for show configuration of Alerts.
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

import WzTabSelector, {
  WzTabSelectorTab,
} from '../util-components/tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import WzConfigurationAlertsGeneral from './alerts-general';
import WzConfigurationAlertsLabels from './alerts-labels';
import WzConfigurationAlertsEmailAlerts from './alerts-email-alerts';
import WzConfigurationAlertsEmailReports from './alerts-reports';
import WzConfigurationAlertsSyslogOutput from './alerts-syslog-output';

import { connect } from 'react-redux';
import { compose } from 'redux';

class WzConfigurationAlerts extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Fragment>
        <WzTabSelector>
          <WzTabSelectorTab label='General'>
            <WzConfigurationAlertsGeneral {...this.props} />
          </WzTabSelectorTab>
          <WzTabSelectorTab label='Labels'>
            <WzConfigurationAlertsLabels {...this.props} />
          </WzTabSelectorTab>
          <WzTabSelectorTab label='Email alerts'>
            <WzConfigurationAlertsEmailAlerts {...this.props} />
          </WzTabSelectorTab>
          <WzTabSelectorTab label='Reports'>
            <WzConfigurationAlertsEmailReports {...this.props} />
          </WzTabSelectorTab>
          <WzTabSelectorTab label='Syslog output'>
            <WzConfigurationAlertsSyslogOutput {...this.props} />
          </WzTabSelectorTab>
        </WzTabSelector>
      </Fragment>
    );
  }
}

const sections = [
  { component: 'analysis', configuration: 'alerts' },
  { component: 'agent', configuration: 'labels' },
  { component: 'mail', configuration: 'alerts' },
  { component: 'monitor', configuration: 'reports' },
  { component: 'csyslog', configuration: 'csyslog' },
];

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzConfigurationAlerts.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default compose(
  withWzConfig(sections),
  connect(mapStateToProps),
)(WzConfigurationAlerts);
