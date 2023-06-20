/*
 * Wazuh app - React component for show configuration of registration service.
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

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import WzNoConfig from '../util-components/no-config';
import { isString, renderValueNoThenEnabled, renderValueYesThenEnabled } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Wazuh agent enrollment',
    href: webDocumentationLink('user-manual/agent-enrollment/index.html')
  },
  {
    text: 'Registration service reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/auth.html')
  }
];

const mainSettings = [
  {
    field: 'disabled',
    label: 'Service status',
    render: renderValueNoThenEnabled,
  },
  { field: 'port', label: 'Listen to connections at port' },
  { field: 'use_source_ip', label: "Use client's source IP address" },
  { field: 'use_password', label: 'Use a password to register agents' },
  { field: 'purge', label: 'Purge agents list when removing agents' },
  {
    field: 'limit_maxagents',
    label: 'Limit registration to maximum number of agents',
  },
  {
    field: 'force.enabled',
    label: 'Force registration when using an existing IP address',
  },
  {
    field: 'force.after_registration_time',
    label:
      'Specifies that the agent replacement will be performed only when the time (seconds) passed since the agent registration is greater than the value configured in the setting',
  },
  {
    field: 'force.key_mismatch',
    label: 'Avoid re-registering agents that already have valid keys',
  },
  {
    field: 'force.disconnected_time.enabled',
    label:
      'Specifies that the replacement will be performed only for agents that have been disconnected longer than a certain time',
  },
  {
    field: 'force.disconnected_time.value',
    label: 'Seconds since an agent is in a disconnected state',
  },
];

const keyRequestSettings = [
  {
    field: 'key_request.enabled',
    label: 'Key request status',
    render: renderValueYesThenEnabled,
  },
  {
    field: 'key_request.exec_path',
    label: 'Full path to the executable',
  },
  {
    field: 'key_request.socket',
    label: 'Full path to the Unix domain socket',
  },
  {
    field: 'key_request.timeout',
    label: 'Maximum time for waiting a response from the executable',
  },
  {
    field: 'key_request.threads',
    label: 'Number of threads for dispatching the external keys requests',
  },
  {
    field: 'key_request.queue_size',
    label: 'Indicates the maximum size of the queue for fetching external keys',
  },
];

const sslSettings = [
  { field: 'ssl_verify_host', label: 'Verify agents using a CA certificate' },
  {
    field: 'ssl_auto_negotiate',
    label: 'Auto-select the SSL negotiation method',
  },
  { field: 'ssl_manager_ca', label: 'CA certificate location' },
  { field: 'ssl_manager_cert', label: 'Server SSL certificate location' },
  { field: 'ssl_manager_key', label: 'Server SSL key location' },
  { field: 'ciphers', label: 'Use the following SSL ciphers' },
];

class WzRegistrationService extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.props.currentConfig['auth-auth'] &&
      this.props.currentConfig['auth-auth'].auth &&
      this.props.currentConfig['auth-auth'].auth.disabled === 'no'
    );
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['auth-auth'] && !currentConfig['auth-auth'].auth && (
          <WzNoConfig error={currentConfig['auth-auth']} help={helpLinks} />
        )}
        {currentConfig['auth-auth'] &&
          currentConfig['auth-auth'].auth &&
          !isString(currentConfig['auth-auth'].auth) && (
            <WzConfigurationSettingsTabSelector
              title="Main settings"
              description="General settings applied to the registration service"
              currentConfig={currentConfig}
              minusHeight={260}
              helpLinks={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={currentConfig['auth-auth'].auth}
                items={mainSettings}
              />
              <WzConfigurationSettingsGroup
                title="Key request settings"
                description="The key request feature allows to fetch agent keys from an external source, for example, a database"
                config={currentConfig['auth-auth'].auth}
                items={keyRequestSettings}
              />
              <WzConfigurationSettingsGroup
                title="SSL settings"
                description="Applied when the registration service uses SSL certificates"
                config={currentConfig['auth-auth'].auth}
                items={sslSettings}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

WzRegistrationService.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig([{ component: 'auth', configuration: 'auth' }])(WzRegistrationService);
