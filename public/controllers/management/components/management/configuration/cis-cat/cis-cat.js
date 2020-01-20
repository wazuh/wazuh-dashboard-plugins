/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import WzNoConfig from '../util-components/no-config';
import TabSelector from '../util-components/tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import WzConfigurationCisCatGeneral from './cis-cat-general';
import WzConfigurationCisCatBenchmarks from './cis-cat-benchmarks';
import { isString } from '../utils/utils';
import { wodleBuilder } from '../utils/builders';
import helpLinks from './help-links';

class WzConfigurationCisCat extends Component{
  constructor(props){
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'cis-cat');
  }
  badgeEnabled(){
    return this.wodleConfig['cis-cat'].disabled !== 'yes';
  }
  componentDidMount(){
    this.props.updateBadge(this.badgeEnabled());
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks}/>
        )}
        {currentConfig && !this.wodleConfig && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        <TabSelector>
          <div label='General'>
            <WzConfigurationCisCatGeneral currentConfig={currentConfig} wodleConfig={this.wodleConfig}/>
          </div>
          <div label='Benchmarks'>
            <WzConfigurationCisCatBenchmarks currentConfig={currentConfig} wodleConfig={this.wodleConfig}/>
          </div>
        </TabSelector>
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationCisCat.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationCisCat);