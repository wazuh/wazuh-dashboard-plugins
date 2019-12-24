import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import withWzConfig from '../util-hocs/wz-config';
import WzNoConfig from '../util-components/no-config';
import TabSelector from '../util-components/tab-selector';
import WzConfigurationPath from '../util-components/configuration-path';
import WzConfigurationVulnerabilitiesGeneral from './vulnerabilities-general';
import WzConfigurationVulnerabilitiesProviders from './vulnerabilities-providers';
import { isString } from '../utils/wz-fetch';

class WzConfigurationVulnerabilities extends Component{
  constructor(props){
    super(props);
    this.config = this.props.currentConfig['wmodules-wmodules'].wmodules.find(item => item['vulnerability-detector']);
  }
  badgeEnabled(){
    return this.config['vulnerability-detector'].disabled !== 'yes';
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title='Vulnerabilities' description='Discover what applications are affected by well-known vulnerabilities' path='Vulnerabilities' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']}/>
        )}
        {currentConfig && !this.config && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present'/>
        )}
        <TabSelector>
          <div label='General'>
            <WzConfigurationVulnerabilitiesGeneral config={this.config}/>
          </div>
          <div label='Providers'>
            <WzConfigurationVulnerabilitiesProviders config={this.config}/>
          </div>
        </TabSelector>
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig('000', sections)(WzConfigurationVulnerabilities);