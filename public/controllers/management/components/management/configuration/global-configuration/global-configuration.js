import React, { Component, Fragment } from "react";

import {
  EuiSpacer
} from "@elastic/eui";

import TabSelector from '../util-components/tab-selector';
import WzConfigurationGlobalConfigurationGlobal from './global-configuration-global';
import WzConfigurationGlobalConfigurationRemote from './global-configuration-remote';
import WzConfigurationPath from '../util-components/configuration-path';

import withWzConfig from '../util-hocs/wz-config';

class WzConfigurationGlobalConfiguration extends Component{
  constructor(props){
    super(props);
    this.container = (content) => (
      <div>
        <EuiSpacer size='xs'/>
        <div>
          {content}
        </div>
      </div>
    );
  }
  render(){
    return (
      <Fragment>
        <WzConfigurationPath title='Global configuration' description='Global and remote settings' path='Global Configuration' updateConfigurationSection={this.props.updateConfigurationSection}/>
        <TabSelector container={this.container}>
          <div label="Global">
            <WzConfigurationGlobalConfigurationGlobal {...this.props}/>
          </div>
          <div label="Remote">
            <WzConfigurationGlobalConfigurationRemote {...this.props}/>
          </div>
        </TabSelector>
      </Fragment>
    )
  }
}

const sections = [
  {component:'analysis',configuration:'global'},
  {component:'mail',configuration:'global'},
  {component:'request',configuration:'remote'},
  {component:'com',configuration:'logging'}
];

export default withWzConfig('000', sections)(WzConfigurationGlobalConfiguration);