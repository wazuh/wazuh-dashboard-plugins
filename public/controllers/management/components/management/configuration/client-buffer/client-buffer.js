/*
 * Wazuh app - React component for show Client-Buffer configuration.
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

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';

import withWzConfig from '../util-hocs/wz-config';
const text1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.client.text1',
  {
    defaultMessage: 'Anti-flooding mechanism',
  },
);
const text2 = i18n.translate(
  'wazuh.controller.manage.comp.confi.client.text2',
  {
    defaultMessage: 'Client buffer reference',
  },
);
const title1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.client.title1',
  {
    defaultMessage: 'Main settings',
  },
);
const descp1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.client.Descp1',
  {
    defaultMessage:
      'These settings determine the event processing rate for the agent',
  },
);
import {
  isString,
  renderValueNoThenEnabled,
  renderValueOrDefault,
} from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: text1,
    href: webDocumentationLink('user-manual/capabilities/antiflooding.html'),
  },
  {
    text: text2,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/client-buffer.html',
    ),
  },
];

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.buffer.status',
      {
        defaultMessage: 'Buffer status',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'queue_size',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.buffer.size',
      {
        defaultMessage: 'Queue size',
      },
    ),
    render: renderValueOrDefault('5000'),
  },
  {
    field: 'events_per_second',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.buffer.event',
      {
        defaultMessage: 'Events per second',
      },
    ),
    render: renderValueOrDefault('500'),
  },
];

class WzConfigurationClientBuffer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['agent-buffer'] &&
          isString(currentConfig['agent-buffer']) && (
            <WzNoConfig
              error={currentConfig['agent-buffer']}
              help={helpLinks}
            />
          )}
        {currentConfig['agent-buffer'] &&
          !isString(currentConfig['agent-buffer']) &&
          !currentConfig['agent-buffer'].buffer && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig['agent-buffer'] &&
          !isString(currentConfig['agent-buffer']) &&
          currentConfig['agent-buffer'].buffer && (
            <WzConfigurationSettingsTabSelector
              title={title1}
              description={descp1}
              currentConfig={currentConfig}
              minusHeight={355}
              helpLinks={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={currentConfig['agent-buffer'].buffer}
                items={mainSettings}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'agent', configuration: 'buffer' }];

WzConfigurationClientBuffer.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationClientBuffer);
