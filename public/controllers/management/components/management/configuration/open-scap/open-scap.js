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

import WzNoConfig from "../util-components/no-config";
import WzTabSelector from '../util-components/tab-selector';
import WzConfigurationOpenSCAPGeneral from './open-scap-general';
import WzConfigurationOpenSCAPEvaluations from './open-scap-evaluations';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';
import { compose } from 'redux';
import withWzConfig from "../util-hocs/wz-config";

class WzConfigurationOpenSCAP extends Component{
  constructor(props){
    super(props);
  }
  componentDidMount(){
    this.props.updateBadge(this.props.currentConfig && this.props.currentConfig['open-scap'] && this.props.currentConfig['open-scap'].disabled === 'no');
  }
  render(){
    let { currentConfig } = this.props;
    currentConfig['open-scap'] = currentConfig['wmodules-wmodules'].wmodules.find(item => item['open-scap'])['open-scap'];
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']} help={''}/>
          )}
        {currentConfig && !currentConfig['open-scap'] && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={''}/>
        )}
        {currentConfig && currentConfig['open-scap'] && (
          <Fragment>
            <WzTabSelector>
              <div label='General'>
                <WzConfigurationOpenSCAPGeneral {...this.props} currentConfig={currentConfig}/>
              </div>
              <div label='Evaluations'>
                <WzConfigurationOpenSCAPEvaluations {...this.props} currentConfig={currentConfig}/>
              </div>

            </WzTabSelector>
          </Fragment>
        )}
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
})

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationOpenSCAP.propTypes = {
  currentConfig: PropTypes.object.isRequired,
};

export default compose(
  connect(mapStateToProps),
  withWzConfig(sections)
)(WzConfigurationOpenSCAP);