import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";


import WzNoConfig from "../util-components/no-config";
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';

import withWzConfig from '../util-hocs/wz-config';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { isString, renderValueNoThenEnabled } from '../utils/utils';

const helpLinks = [
  { text: 'Active response documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/active-response/index.html' },
  { text: 'Active response reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/active-response.html' },
];

const mainSettings = [
  { field: 'disabled', label: 'Active response status', render: renderValueNoThenEnabled},
  { field: 'repeated_offenders', label: 'List of timeouts (in minutes) for repeated offenders' },
  { field: 'ca_store', label: 'Use the following list of root CA certificates' },
  { field: 'ca_verification', label: 'Validate WPKs using root CA certificate' }
];

class WzConfigurationActiveResponseAgent extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig['com-active-response'] && isString(currentConfig['com-active-response']) && (
          <WzNoConfig error={currentConfig['com-active-response']} help={helpLinks}/>
          )}
        {currentConfig['com-active-response'] && !isString(currentConfig['com-active-response']) && !currentConfig['com-active-response']['active-response'] && (
          <WzNoConfig error='not-present' help={helpLinks}/>
          )}
        {wazuhNotReadyYet && (!currentConfig || !currentConfig['com-active-response']) && (
          <WzNoConfig error='Wazuh not ready yet' help={helpLinks}/>
        )}
        {currentConfig['com-active-response'] && !isString(currentConfig['com-active-response']) && currentConfig['com-active-response']['active-response'] && (
          <WzConfigurationSettingsTabSelector
            title='Active response settings'
            description='Find here all the Active response settings for this agent'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup
              config={currentConfig['com-active-response']['active-response']}
              items={mainSettings}
            />
        </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
});

const sectionsAgent = [{component:'com',configuration:'active-response'}];

export default compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent)
)(WzConfigurationActiveResponseAgent);
