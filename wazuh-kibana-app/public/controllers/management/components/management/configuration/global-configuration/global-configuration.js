/*
 * Wazuh app - React component for show configuration of global configuration.
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

import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import WzConfigurationGlobalConfigurationGlobal from './global-configuration-global';
import WzConfigurationGlobalConfigurationRemote from './global-configuration-remote';

import withWzConfig from '../util-hocs/wz-config';

import { connect } from 'react-redux';
import { compose } from 'redux';

class WzConfigurationGlobalConfiguration extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { agent } = this.props;
    return (
      <Fragment>
        {agent && agent.id === '000' ? (
          <WzTabSelector>
            <WzTabSelectorTab label="Global">
              <WzConfigurationGlobalConfigurationGlobal {...this.props} />
            </WzTabSelectorTab>
            <WzTabSelectorTab label="Remote">
              <WzConfigurationGlobalConfigurationRemote {...this.props} />
            </WzTabSelectorTab>
          </WzTabSelector>
        ) : (
          <WzConfigurationGlobalConfigurationGlobal {...this.props} />
        )}
      </Fragment>
    );
  }
}

const sectionsManager = [
  { component: 'analysis', configuration: 'global' },
  { component: 'mail', configuration: 'global' },
  { component: 'request', configuration: 'remote' },
  { component: 'com', configuration: 'logging' }
];

const sectionsAgent = [{ component: 'com', configuration: 'logging' }];

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected
});

export const WzConfigurationGlobalConfigurationManager = compose(
  connect(mapStateToProps),
  withWzConfig(sectionsManager)
)(WzConfigurationGlobalConfiguration);

export const WzConfigurationGlobalConfigurationAgent = compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent)
)(WzConfigurationGlobalConfiguration);

WzConfigurationGlobalConfigurationManager.propTypes = {
  agent: PropTypes.object
};

WzConfigurationGlobalConfigurationAgent.propTypes = {
  agent: PropTypes.object
};
