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

import {
  EuiSpacer
} from "@elastic/eui";

import WzTabSelector from '../util-components/tab-selector';
import WzConfigurationGlobalConfigurationGlobal from './global-configuration-global';
import WzConfigurationGlobalConfigurationRemote from './global-configuration-remote';

import withWzConfig from '../util-hocs/wz-config';

import { connect } from 'react-redux';
import { compose } from 'redux';

class WzConfigurationGlobalConfiguration extends Component{
  constructor(props){
    super(props);
    
  }
  render(){
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {(agent && agent.id === '000') ? (
          <WzTabSelector>
            <div label="Global">
              <WzConfigurationGlobalConfigurationGlobal {...this.props}/>
            </div>
            <div label="Remote">
              <WzConfigurationGlobalConfigurationRemote {...this.props}/>
            </div>
          </WzTabSelector>

        ) : <WzConfigurationGlobalConfigurationGlobal {...this.props}/>}
      </Fragment>
    )
  }
}

const sectionsManager = [
  {component:'analysis',configuration:'global'},
  {component:'mail',configuration:'global'},
  {component:'request',configuration:'remote'},
  {component:'com',configuration:'logging'}
];

const sectionsAgent = [
  {component:'com',configuration:'logging'}
];

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
});

export const WzConfigurationGlobalConfigurationManager = compose(
  withWzConfig(sectionsManager),
  connect(mapStateToProps)
)(WzConfigurationGlobalConfiguration);

export const WzConfigurationGlobalConfigurationAgent = compose(
  withWzConfig(sectionsAgent),
  connect(mapStateToProps)
)(WzConfigurationGlobalConfiguration);