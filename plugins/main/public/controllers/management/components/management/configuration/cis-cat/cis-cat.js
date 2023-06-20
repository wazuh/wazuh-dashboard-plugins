/*
 * Wazuh app - React component for show configuration of CIS-CAT.
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
import withWzConfig from '../util-hocs/wz-config';
import WzConfigurationCisCatGeneral from './cis-cat-general';
import WzConfigurationCisCatBenchmarks from './cis-cat-benchmarks';
import { wodleBuilder } from '../utils/builders';

class WzConfigurationCisCat extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'cis-cat');
  }
  badgeEnabled() {
    return (
      this.wodleConfig['cis-cat'] &&
      this.wodleConfig['cis-cat'].disabled !== 'yes'
    );
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  render() {
    return (
      <WzTabSelector>
        <WzTabSelectorTab label="General">
          <WzConfigurationCisCatGeneral
            {...this.props}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
        <WzTabSelectorTab label="Benchmarks">
          <WzConfigurationCisCatBenchmarks
            {...this.props}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
      </WzTabSelector>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationCisCat.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationCisCat);
