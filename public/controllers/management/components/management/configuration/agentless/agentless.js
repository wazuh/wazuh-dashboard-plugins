/*
 * Wazuh app - React component for show configuration of agentless.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@kbn/i18n';

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { i18n } from '@kbn/i18n';
import withWzConfig from '../util-hocs/wz-config';
import WzNoConfig from '../util-components/no-config';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';
import { compose } from 'redux';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const mainSettings = [
  {
    field: 'type',
    label: i18n.translate(
      'wazuh.public.controller.management.config.agentless.type',
      {
        defaultMessage: 'Agentless monitoring type',
      },
    ),
  },
  {
    field: 'frequency',
    label: i18n.translate(
      'wazuh.public.controller.management.config.agentless.interval',
      {
        defaultMessage: 'Interval (in seconds) between checks',
      },
    ),
  },
  {
    field: 'host',
    label: i18n.translate(
      'wazuh.public.controller.management.config.agentless.hotname',
      {
        defaultMessage: 'Device username and hostname',
      },
    ),
  },
  {
    field: 'state',
    label: i18n.translate(
      'wazuh.public.controller.management.config.agentless.device',
      {
        defaultMessage: 'Device check type',
      },
    ),
  },
  {
    field: 'arguments',
    label: i18n.translate(
      'wazuh.public.controller.management.config.agentless.arugments',
      {
        defaultMessage: 'Pass these arguments to check',
      },
    ),
  },
];
const text2 = i18n.translate(
  'wazuh.controller.manage.comp.confi.setting.response.agentless.text2',
  {
    defaultMessage: 'How to monitor agentless devices',
  },
);
const text3 = i18n.translate(
  'wazuh.controller.manage.comp.confi.setting.response.agentless.text3',
  {
    defaultMessage: 'Agentless reference',
  },
);
const helpLinks = [
  {
    text: text2,
    href: webDocumentationLink(
      'user-manual/capabilities/agentless-monitoring/index.html',
    ),
  },
  {
    text: text3,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/agentless.html',
    ),
  },
];

class WzConfigurationAgentless extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const items =
      currentConfig &&
      currentConfig['agentless-agentless'] &&
      currentConfig['agentless-agentless'].agentless
        ? currentConfig['agentless-agentless'].agentless.map(item => ({
            label: `${item.type} (${item.state})`,
            data: item,
          }))
        : false;
    return (
      <Fragment>
        {currentConfig['agentless-agentless'] &&
          isString(currentConfig['agentless-agentless']) && (
            <WzNoConfig
              error={currentConfig['agentless-agentless']}
              help={helpLinks}
            />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['agentless-agentless']) && (
            <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
          )}
        {currentConfig['agentless-agentless'] &&
          !isString(currentConfig['agentless-agentless']) && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.agentless.devices',
                {
                  defaultMessage: 'Devices list',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.agentless.agentUse',
                {
                  defaultMessage:
                    "List of monitored devices that don't use the agent",
                },
              )}
              currentConfig={currentConfig}
              minusHeight={260}
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

const sections = [{ component: 'agentless', configuration: 'agentless' }];

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzConfigurationAgentless.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default compose(
  withWzConfig(sections),
  connect(mapStateToProps),
)(WzConfigurationAgentless);
