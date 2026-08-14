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

/* Only the logging settings apply here: the alerts settings belong to
analysisd, which does not run on an agent. */
const mainSettings = [
  { field: 'plain', label: 'Write internal logs in plain text' },
  { field: 'json', label: 'Write internal logs in JSON format' },
];

const buildHelpLinks = agent => [helpLinks[1]];

class WzConfigurationGlobalConfigurationGlobal extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    const helpLinks = buildHelpLinks(agent);
    const loggingConfig = currentConfig?.execd?.logging;

    if (isString(loggingConfig)) {
      return <WzNoConfig error={loggingConfig} help={helpLinks} />;
    }

    if (!loggingConfig) {
      return wazuhNotReadyYet ? (
        <WzNoConfig error='Server not ready yet' help={helpLinks} />
      ) : (
        <WzNoConfig error='not-present' help={helpLinks} />
      );
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Main settings'
          description='Basic logging settings'
          help={helpLinks}
        >
          <WzConfigurationSettingsGroup
            config={loggingConfig}
            items={mainSettings}
          />
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

WzConfigurationGlobalConfigurationGlobal.propTypes = {
  agent: PropTypes.object,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  currentConfig: PropTypes.object,
};

export default WzConfigurationGlobalConfigurationGlobal;
