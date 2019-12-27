import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzTabSelector from '../util-components/tab-selector';
import WzConfigurationPath from '../util-components/configuration-path';
import WzConfigurationActiveResponseActiveResponse from './active-response-active-response';
import WzConfigurationActiveResponseCommands from './active-response-commands';
import withWzConfig from "../util-hocs/wz-config";

class WzConfigurationActiveResponse extends Component{
  constructor(props){
    super(props);
  }
  render(){
    return (
      <Fragment>
        <WzConfigurationPath title='Active response' description='Active threat addressing by inmmediate response' path='Active response' updateConfigurationSection={this.props.updateConfigurationSection} />
        <WzTabSelector>
          <div label='Active response'>
            <WzConfigurationActiveResponseActiveResponse currentConfig={this.props.currentConfig}/>
          </div>
          <div label='Commands'>
            <WzConfigurationActiveResponseCommands currentConfig={this.props.currentConfig}/>
          </div>
        </WzTabSelector>
      </Fragment>
    )
  }
}

const sections = [{component:'analysis',configuration:'command'},{component:'analysis',configuration:'active_response'}];

export default withWzConfig('000', sections)(WzConfigurationActiveResponse);