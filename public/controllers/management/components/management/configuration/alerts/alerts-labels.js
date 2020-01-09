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
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import withWzConfig from '../util-hocs/wz-config';
import { isString, hasSize } from '../utils/utils';

import { compose } from 'redux';
import { connect } from 'react-redux';

const columns = [ 
  { field: 'label_key', name: 'Label key' },
  { field: 'label_value', name: 'Label value' },
  { field: 'label_hidden', name: 'Hidden' }
];

const helpLinks = [
  {text: 'Labels documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/labels.html'},
  {text: 'Labels reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/labels.html'}
];

class WzConfigurationAlertsLabels extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    console.log('labels', this.props)
    return (
      <Fragment>
        {currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels'] && isString(currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']) && (
          <WzNoConfig error={currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']}/>
        )}
        {currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels'] && !isString(currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']) && !hasSize(currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels'].labels) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {wazuhNotReadyYet && (!currentConfig || !currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']) && (
          <WzNoConfig error='Wazuh not ready yet'/>
        )}
        {currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels'] && !isString(currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']) && hasSize(currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels'].labels) ? (
          <WzConfigurationSettingsTabSelector title='Defined labels'currentConfig={currentConfig} helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup
              config={mainSettingsConfig}
              items={mainSettings}
            />
            <EuiBasicTable
              columns={columns}
              items={currentConfig['analysis-labels'].labels}/>
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
});

export default connect(mapStateToProps)(WzConfigurationAlertsLabels);

const sectionsAgent = [{component:'agent',configuration:'labels'}];

export const WzConfigurationAlertsLabelsAgent = compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent)
)(WzConfigurationAlertsLabels)