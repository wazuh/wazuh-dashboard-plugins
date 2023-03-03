/*
 * Wazuh app - React component for show configuration of Docker listener.
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
import {
  isString,
  renderValueOrDefault,
  renderValueNoThenEnabled,
  renderValueOrYes,
} from '../utils/utils';

import withWzConfig from '../util-hocs/wz-config';
import { wodleBuilder } from '../utils/builders';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
const title1 = i18n.translate('wazuh.controller.manage.comp.confi.docker.title1', {
  defaultMessage: 'Main settings',
});
const descp1 = i18n.translate('wazuh.controller.manage.comp.confi.docker.descp1', {
  defaultMessage: 'General Docker listener settings',
});
const text1 = i18n.translate('wazuh.controller.manage.comp.confi.docker.text1', {
  defaultMessage: 'Monitoring containers activity',
});
const text2 = i18n.translate('wazuh.controller.manage.comp.confi.docker.text2', {
  defaultMessage: 'Docker listener module reference',
});
const label1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.docker.label1',
  {
    defaultMessage: 'Docker listener status',
  },
);
const label2 = i18n.translate(
  'wazuh.controller.manage.comp.confi.docker.label2',
  {
    defaultMessage: 'Number of attempts to execute the listener',
  },
);
const label3 = i18n.translate(
  'wazuh.controller.manage.comp.confi.docker.label3',
  {
    defaultMessage: 'Waiting time to rerun the listener in case it fails',
  },
);
const label4 = i18n.translate(
  'wazuh.controller.manage.comp.confi.docker.label4',
  {
    defaultMessage: 'Run the listener immediately when service is started',
  },
);
const helpLinks = [
  {
    text: text1,
    href: webDocumentationLink(
      'container-security/docker-monitor/monitoring-containers-activity.html',
    ),
  },
  {
    text: text2,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-docker.html',
    ),
  },
];

const mainSettings = [
  {
    field: 'disabled',
    label: label1,
    render: renderValueNoThenEnabled,
  },
  {
    field: 'attempts',
    label: label2,
    render: renderValueOrDefault('5'),
  },
  {
    field: 'interval',
    label: label3,
    render: renderValueOrDefault('10m'),
  },
  {
    field: 'run_on_start',
    label: label4,
    render: renderValueOrYes,
  },
];

class WzConfigurationDockerListener extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(
      this.props.currentConfig,
      'docker-listener',
    );
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.props.currentConfig &&
      this.wodleConfig['docker-listener'] &&
      this.wodleConfig['docker-listener'].disabled === 'no'
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
          !this.wodleConfig['docker-listener'] &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig && this.wodleConfig['docker-listener'] && (
          <WzConfigurationSettingsTabSelector
            title={title1}
            description={descp1}
            currentConfig={this.wodleConfig}
            minusHeight={this.props.agent.id === '000' ? 240 : 355}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={this.wodleConfig['docker-listener']}
              items={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationDockerListener.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationDockerListener);
