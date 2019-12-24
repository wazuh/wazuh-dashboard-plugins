import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import WzNoConfig from '../util-components/no-config';
import TabSelector from '../util-components/tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/wz-fetch';

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
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title='CIS-CAT' description='Configuration assessment using CIS scanner and SCAP checks' path='CIS-CAT' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']}/>
        )}
        {currentConfig && !this.config && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present'/>
        )}
        <TabSelector>
          <div label='General'>
            <WzConfigurationCisCatGeneral config={this.config}/>
          </div>
          <div label='Benchmarks'>
            <WzConfigurationCisCatBenchmarks config={this.config}/>
          </div>
        </TabSelector>
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig('000', sections)(WzConfigurationCisCat);