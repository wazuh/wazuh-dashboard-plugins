/*
 * Wazuh app - React component for show configuration of OpenSCAP.
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

import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import WzConfigurationOpenSCAPGeneral from './open-scap-general';
import WzConfigurationOpenSCAPEvaluations from './open-scap-evaluations';

import { connect } from 'react-redux';
import { compose } from 'redux';
import withWzConfig from '../util-hocs/wz-config';
import { wodleBuilder } from '../utils/builders';

class WzConfigurationOpenSCAP extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'open-scap');
  }
  componentDidMount() {
    this.props.updateBadge(
      this.props.currentConfig &&
        this.props.currentConfig['open-scap'] &&
        this.props.currentConfig['open-scap'].disabled === 'no'
    );
  }
  render() {
    let { currentConfig } = this.props;
    return (
      <WzTabSelector>
        <WzTabSelectorTab label="General">
          <WzConfigurationOpenSCAPGeneral
            {...this.props}
            currentConfig={currentConfig}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
        <WzTabSelectorTab label="Evaluations">
          <WzConfigurationOpenSCAPEvaluations
            {...this.props}
            currentConfig={currentConfig}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
      </WzTabSelector>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationOpenSCAP.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default compose(
  connect(mapStateToProps),
  withWzConfig(sections)
)(WzConfigurationOpenSCAP);
