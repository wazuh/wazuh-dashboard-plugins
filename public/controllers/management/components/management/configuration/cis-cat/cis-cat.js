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
import { isString } from '../utils/utils';
import helpLinks from './help-links';
import WzConfigurationCisCatGeneral from './cis-cat-general';
import WzConfigurationCisCatBenchmarks from './cis-cat-benchmarks';

class WzConfigurationCisCat extends Component{
  constructor(props){
    super(props);
    this.config = this.props.currentConfig['wmodules-wmodules'].wmodules.find(item => item['cis-cat']);
  }
  badgeEnabled(){
    return this.config['cis-cat'].disabled !== 'yes';
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
        {currentConfig && !this.config && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        <TabSelector>
          <div label='General'>
            <WzConfigurationCisCatGeneral currentConfig={this.config}/>
          </div>
          <div label='Benchmarks'>
            <WzConfigurationCisCatBenchmarks currentConfig={this.config}/>
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