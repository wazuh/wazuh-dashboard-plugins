/*
 * Wazuh app - React component for show configuration of active response - agent tab.
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

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';

import withWzConfig from '../util-hocs/wz-config';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Active response documentation',
    href: webDocumentationLink('user-manual/capabilities/active-response/index.html')
  },
  {
    text: 'Active response reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/active-response.html')
  }
];

const mainSettings = [
  {
    field: 'disabled',
    label: 'Active response status',
    render: renderValueNoThenEnabled
  },
  {
    field: 'repeated_offenders',
    label: 'List of timeouts (in minutes) for repeated offenders'
  },
  {
    field: 'ca_store',
    label: 'Use the following list of root CA certificates'
  },
  { field: 'ca_verification', label: 'Validate WPKs using root CA certificate' }
];

class WzConfigurationActiveResponseAgent extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig['com-active-response'] &&
          isString(currentConfig['com-active-response']) && (
            <WzNoConfig
              error={currentConfig['com-active-response']}
              help={helpLinks}
            />
          )}
        {currentConfig['com-active-response'] &&
          !isString(currentConfig['com-active-response']) &&
          !currentConfig['com-active-response']['active-response'] && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['com-active-response']) && (
            <WzNoConfig error="Wazuh not ready yet" help={helpLinks} />
          )}
        {currentConfig['com-active-response'] &&
          !isString(currentConfig['com-active-response']) &&
          currentConfig['com-active-response']['active-response'] && (
            <WzConfigurationSettingsTabSelector
              title="Active response settings"
              description="Find here all the Active response settings for this agent"
              currentConfig={currentConfig}
              minusHeight={this.props.agent.id === '000' ? 280 : 355}
              helpLinks={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={currentConfig['com-active-response']['active-response']}
                items={mainSettings}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

const sectionsAgent = [{ component: 'com', configuration: 'active-response' }];

WzConfigurationActiveResponseAgent.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};

export default compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent)
)(WzConfigurationActiveResponseAgent);
