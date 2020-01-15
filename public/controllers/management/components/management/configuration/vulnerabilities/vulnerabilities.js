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

import withWzConfig from '../util-hocs/wz-config';
import WzNoConfig from '../util-components/no-config';
import WzTabSelector from '../util-components/tab-selector';
import WzConfigurationVulnerabilitiesGeneral from './vulnerabilities-general';
import WzConfigurationVulnerabilitiesProviders from './vulnerabilities-providers';
import { isString } from '../utils/utils';

class WzConfigurationVulnerabilities extends Component{
  constructor(props){
    super(props);
    this.config = this.props.currentConfig['wmodules-wmodules'].wmodules.find(item => item['vulnerability-detector']);
  }
  componentDidMount(){
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled(){
    return this.config['vulnerability-detector'].disabled !== 'yes';
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']}/>
        )}
        {currentConfig && !this.config && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present'/>
        )}
        <WzTabSelector>
          <div label='General'>
            <WzConfigurationVulnerabilitiesGeneral config={this.config}/>
          </div>
          <div label='Providers'>
            <WzConfigurationVulnerabilitiesProviders config={this.config}/>
          </div>
        </WzTabSelector>
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationVulnerabilities.propTypes = {
  currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationVulnerabilities);