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
import { i18n } from '@kbn/i18n';

import { EuiBasicTable } from '@elastic/eui';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import {
  isString,
  renderValueOrAll,
  renderValueOrNo,
  renderValueOrDefault,
} from '../utils/utils';

import { connect } from 'react-redux';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
const descp1 = i18n.translate('wazuh.controller.manage.comp.confi.setting.Descp1', {
  defaultMessage: 'Output alerts to a syslog server',
});
const title1 = i18n.translate('wazuh.controller.manage.comp.confi.setting.title1', {
  defaultMessage: 'Main settings',
});
const helpLinks = [
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.alerts.sysLogConfigure',
      {
        defaultMessage: 'Configuring syslog output',
      },
    ),
    href: webDocumentationLink('user-manual/manager/manual-syslog-output.html'),
  },
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.alerts.sysLog',
      {
        defaultMessage: 'Syslog output reference',
      },
    ),
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/syslog-output.html',
    ),
  },
];

const columns = [
  { field: 'server', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.Server', {
          defaultMessage: 'Server',
        }) },
  { field: 'port', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.Port', {
          defaultMessage: 'Port',
        }) },
  { field: 'level', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.Level', {
          defaultMessage: 'Level',
        }) },
  { field: 'format', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.Format', {
          defaultMessage: 'Format',
        }), render: renderValueOrDefault('default') },
  { field: 'use_fqdn', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.FQDN', {
          defaultMessage: 'FQDN',
        }), render: renderValueOrNo },
  { field: 'rule_id', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.RuleID', {
          defaultMessage: 'Rule ID',
        }), render: renderValueOrAll },
  { field: 'group', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.Group', {
          defaultMessage: 'Group',
        }), render: renderValueOrAll },
  { field: 'location', name: i18n.translate('wazuh.public.controller.management.config.alerts.sysLog.Location', {
          defaultMessage: 'Location',
        }), render: renderValueOrAll },
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
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['csyslog-csyslog']) && (
            <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
          )}
        {currentConfig['csyslog-csyslog'] &&
          !isString(currentConfig['csyslog-csyslog']) &&
          currentConfig['csyslog-csyslog'].syslog_output &&
          currentConfig['csyslog-csyslog'].syslog_output.length && (
            <WzConfigurationSettingsTabSelector
              title={title1}
              description={descp1}
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
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzConfigurationAlertsReports.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default connect(mapStateToProps)(WzConfigurationAlertsReports);
