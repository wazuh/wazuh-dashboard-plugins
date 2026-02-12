/*
 * Wazuh app - React component for show configuration of global configuration - global tab.
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

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';

import { isString } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Global reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/global.html'),
  },
  {
    text: 'Logging reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/logging.html'),
  },
];

const mainSettings = [
  { field: 'alerts_log', label: 'Write alerts to alerts.log file' },
  {
    field: 'jsonout_output',
    label: 'Write JSON formatted alerts to alerts.json file',
  },
  { field: 'logall', label: 'Archive all the alerts in plain text format' },
  { field: 'logall_json', label: 'Archive all the alerts in JSON format' },
  {
    field: 'custom_alert_output',
    label: 'Customized alerts format for alerts.log file',
  },
  { field: 'plain', label: 'Write internal logs in plain text' },
  { field: 'json', label: 'Write internal logs in JSON format' },
  { field: 'max_output_size', label: 'Size limit of alert files' },
  { field: 'rotate_interval', label: 'File rotation interval' },
];

const buildHelpLinks = agent => [helpLinks[1]];

class WzConfigurationGlobalConfigurationGlobal extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    const helpLinks = buildHelpLinks(agent);
    const mainSettingsConfig = currentConfig['com-logging']?.logging
      ? {
          plain: currentConfig['com-logging'].logging.plain,
          json: currentConfig['com-logging'].logging.json,
        }
      : {};
    return (
      <Fragment>
        {currentConfig['analysis-global'] &&
          isString(currentConfig['analysis-global']) && (
            <WzNoConfig
              error={currentConfig['analysis-global']}
              help={helpLinks}
            />
          )}
        {currentConfig['com-logging'] &&
          isString(currentConfig['com-logging']) && (
            <WzNoConfig error={currentConfig['com-global']} help={helpLinks} />
          )}
        {currentConfig['analysis-global'] &&
          !isString(currentConfig['analysis-global']) &&
          !currentConfig['analysis-global'].global && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['analysis-global']) && (
            <WzNoConfig error='Server not ready yet' help={helpLinks} />
          )}
        {((currentConfig['analysis-global'] &&
          currentConfig['analysis-global'].global) ||
          (currentConfig['com-logging'] &&
            currentConfig['com-logging'].logging)) && (
          <WzConfigurationSettingsHeader
            title='Main settings'
            description='Basic alerts and logging settings'
            help={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={mainSettingsConfig}
              items={mainSettings}
            />
          </WzConfigurationSettingsHeader>
        )}
      </Fragment>
    );
  }
}

WzConfigurationGlobalConfigurationGlobal.propTypes = {
  agent: PropTypes.object,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default WzConfigurationGlobalConfigurationGlobal;
