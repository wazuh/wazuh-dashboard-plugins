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
import { i18n } from '@kbn/i18n';

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import WzNoConfig from '../util-components/no-config';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
;
const helpLinks = [
  {
    text: i18n.translate('wazuh.public.controller.management.config.policy.registration.enrollment', {
          defaultMessage: 'Wazuh agent enrollment',
        }),
    href: webDocumentationLink('user-manual/agent-enrollment/index.html')
  },
  {
    text: i18n.translate('wazuh.public.controller.management.config.policy.registration.ref', {
          defaultMessage: 'Registration service reference',
        }),
    href: webDocumentationLink('user-manual/reference/ossec-conf/auth.html')
  }
];

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.status', {
          defaultMessage: 'Service status',
        }),
    render: renderValueNoThenEnabled
  },
  { field: 'port', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.connection', {
          defaultMessage: 'Listen to connections at port',
        }) },
  { field: 'use_source_ip', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.client', {
          defaultMessage: "Use client's source IP address",
        }) },
  { field: 'use_password', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.password', {
          defaultMessage: 'Use a password to register agents',
        }) },
  { field: 'purge', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.purge', {
          defaultMessage: 'Purge agents list when removing agents',
        }) },
  {
    field: 'limit_maxagents',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.limit', {
          defaultMessage: 'Limit registration to maximum number of agents',
        })
  },
  {
    field: 'force.enabled',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.address', {
          defaultMessage: 'Force registration when using an existing IP address',
        })
  },
  {
    field: 'force.after_registration_time',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.agent', {
          defaultMessage: 'Specifies that the agent replacement will be performed only when the time (seconds) passed since the agent registration is greater than the value configured in the setting',
        })
  },
  {
    field: 'force.key_mismatch',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.', {
          defaultMessage: '',
        })'Avoid re-registering agents that already have valid keys'
  },
  {
    field: 'force.disconnected_time.enabled',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.certain', {
          defaultMessage: 'Specifies that the replacement will be performed only for agents that have been disconnected longer than a certain time',
        })
  },
  {
    field: 'force.disconnected_time.value',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.state', {
          defaultMessage: 'Seconds since an agent is in a disconnected state',
        })
  },
];
const sslSettings = [
  { field: 'ssl_verify_host', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.CACertificate', {
          defaultMessage: 'Verify agents using a CA certificate',
        }) },
  {
    field: 'ssl_auto_negotiate',
    label: i18n.translate('wazuh.public.controller.management.config.policy.registration.SSl', {
          defaultMessage: 'Auto-select the SSL negotiation method',
        })
  },
  { field: 'ssl_manager_ca', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.ca', {
          defaultMessage: 'CA certificate location',
        }) },
  { field: 'ssl_manager_cert', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.server', {
          defaultMessage: 'Server SSL certificate location',
        }) },
  { field: 'ssl_manager_key', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.ssl', {
          defaultMessage: 'Server SSL key location',
        }) },
  { field: 'ciphers', label: i18n.translate('wazuh.public.controller.management.config.policy.registration.use', {
          defaultMessage: 'Use the following SSL ciphers',
        }) }
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
              title={i18n.translate('wazuh.public.controller.management.config.policy.registration.MainSettings', {
          defaultMessage: 'Main settings',
        })}
              description={i18n.translate('wazuh.public.controller.management.config.policy.registration.gernalSetting', {
          defaultMessage: 'General settings applied to the registration service',
        })}
              currentConfig={currentConfig}
              minusHeight={260}
              helpLinks={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={currentConfig['auth-auth'].auth}
                items={mainSettings}
              />
              <WzConfigurationSettingsGroup
                title={i18n.translate('wazuh.public.controller.management.config.policy.registration.SSLsettings', {
          defaultMessage: 'SSL settings',
        })}
                description={i18n.translate('wazuh.public.controller.management.config.policy.registration.applied', {
          defaultMessage: 'Applied when the registration service uses SSL certificates',
        })}
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

export default withWzConfig([{ component: 'auth', configuration: 'auth' }])(
  WzRegistrationService
);
