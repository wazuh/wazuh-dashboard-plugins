/*
 * Wazuh app - React component for show configuration of inventory.
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

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import withWzConfig from '../util-hocs/wz-config';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { wodleBuilder } from '../utils/builders';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.status',
      {
        defaultMessage: 'Syscollector integration status',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.',
      {
        defaultMessage: '',
      },
    ),
  },
  {
    field: 'scan-on-start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.ScanOnStart',
      {
        defaultMessage: 'Scan on start',
      },
    ),
  },
];

const scanSettings = [
  {
    field: 'hardware',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.ScanHardwareInfo',
      {
        defaultMessage: 'Scan hardware info',
      },
    ),
  },
  {
    field: 'processes',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.Scancurrentprocesses',
      {
        defaultMessage: 'Scan current processes',
      },
    ),
  },
  {
    field: 'os',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.scanOperating',
      {
        defaultMessage: 'Scan operating system info',
      },
    ),
  },
  {
    field: 'packages',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.scanInstalled',
      {
        defaultMessage: 'Scan installed packages',
      },
    ),
  },
  {
    field: 'network',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.interface',
      {
        defaultMessage: 'Scan network interfaces',
      },
    ),
  },
  {
    field: 'ports',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.scanListening',
      {
        defaultMessage: 'Scan listening network ports',
      },
    ),
  },
  {
    field: 'ports_all',
    label: i18n.translate(
      'wazuh.public.controller.management.config.inventory.networkPorts',
      {
        defaultMessage: 'Scan all network ports',
      },
    ),
  },
];

const helpLinks = [
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.inventory.SystemInventory',
      {
        defaultMessage: 'System inventory',
      },
    ),
    href: webDocumentationLink('user-manual/capabilities/syscollector.html'),
  },
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.inventory.Syscollectormodulereference',
      {
        defaultMessage: 'Syscollector module reference',
      },
    ),
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-syscollector.html',
    ),
  },
];

class WzConfigurationInventory extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'syscollector');
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.wodleConfig &&
      this.wodleConfig.syscollector &&
      this.wodleConfig.syscollector.disabled === 'no'
    );
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] &&
          isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig
              error={currentConfig['wmodules-wmodules']}
              help={helpLinks}
            />
          )}
        {currentConfig &&
          !this.wodleConfig.syscollector &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig && this.wodleConfig && this.wodleConfig.syscollector && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.inventory.MainSettings',
              {
                defaultMessage: 'Main settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.inventory.General settingsApplied',
              {
                defaultMessage: 'General settings applied to all the scans',
              },
            )}
            currentConfig={this.wodleConfig}
            minusHeight={this.props.agent.id === '000' ? 260 : 355}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={this.wodleConfig.syscollector}
              items={mainSettings}
            />
            <WzConfigurationSettingsGroup
              title={i18n.translate(
                'wazuh.public.controller.management.config.inventory.Scansettings',
                {
                  defaultMessage: 'Scan settings',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.inventory.collect',
                {
                  defaultMessage: 'Specific inventory scans to collect',
                },
              )}
              config={this.wodleConfig.syscollector}
              items={scanSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationInventory.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationInventory);
