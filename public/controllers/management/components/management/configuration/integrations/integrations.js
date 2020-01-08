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
  EuiTitle,
  EuiText,
  EuiHorizontalRule
} from "@elastic/eui";

import { WzConfigurationSettingsHeaderViewer } from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import { WzSettingsViewer } from '../util-components/code-viewer';
import withWzConfig from '../util-hocs/wz-config';
import { capitalize, isString } from '../utils/utils';

const helpLinks = [
  { text: 'How to integrate Wazuh with external APIs', href: 'https://documentation.wazuh.com/current/user-manual/manager/manual-integration.html'},
  { text: 'VirusTotal integration documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/virustotal-scan/index.html'},
  { text: 'Integration reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/integration.html'}
];

const defaultIntegrations = [
  { title: 'Slack', description: 'Get alerts directly on Slack' },
  { title: 'VirusTotal', description: 'Get notified when malicious software is found'},
  { title: 'PagerDuty', description: 'Get alerts on this streamlined incident resolution software'}
];

const integrationsSettings = [
  { field: 'hook_url', label: 'Hook URL'},
  { field: 'level', label: 'Filter alerts by this level or above' },
  { field: 'rule_id', label: 'Filter alerts by these rule IDs' },
  { field: 'group', label: 'Filter alerts by these rule groupst' },
  { field: 'event_location', label: 'Filter alerts by location (agent, IP or file)' },
  { field: 'alert_format', label: 'Used format to write alerts' }
];

class WzConfigurationIntegrations extends Component{
  constructor(props){
    super(props);
    this.state = {
      view: ''
    }
  }
  changeView(view){
    this.setState({ view })
  }
  buildIntegration(integration){
    return defaultIntegrations.find(i => i.title && i.title.toLocaleLowerCase() === integration) || { title: capitalize(integration), description: 'Custom integration' };
  }
  render(){
    const { view } = this.state;
    const { currentConfig } = this.props;
    const integrations = currentConfig['integrator-integration'] && currentConfig['integrator-integration'].integrations ? Object.keys(currentConfig['integrator-integration'].integration) : false;
    return (
      <Fragment>
        {currentConfig['integrator-integration'] && isString(currentConfig['integrator-integration']) && (
          <WzNoConfig error={currentConfig['integrator-integration']} help={helpLinks}/>
        )}
        {currentConfig['integrator-integration'] && !isString(currentConfig['integrator-integration']) && (
          <WzViewSelector view={view}>
            <div default>
              {integrations.map((integrationKey) => {
                const integration = Object.assign(this.buildIntegration(integration), currentConfig['integrator-integration'].integration[integrationKey]);
                return (
                  <Fragment key={`integration-${integration.title}`}>
                    <WzConfigurationSettingsGroup
                      title={integration.title}
                      description={integration.description}
                      items={integrationsSettings}
                      config={integration}
                      viewSelected={view}
                      settings={() => this.changeView('')}
                      json={() => this.changeView('json')}
                      xml={() => this.changeView('xml')}
                      help={this.helpLinks}/>
                  </Fragment>
                )
              })}
            </div>
            <div view='json'>
              <WzConfigurationSettingsHeaderViewer
                mode='json'
                view={view}
                settings={() =>  this.changeView('')}
                json={() => this.changeView('json')}
                xml={() => this.changeView('xml')}
                help={helpLinks}/>
              <WzSettingsViewer mode='json' value={currentConfig}/>
            </div>
            <div view='xml'>
              <WzConfigurationSettingsHeaderViewer
                mode='xml'
                view={view}
                settings={() =>  this.changeView('')}
                json={() => this.changeView('json')}
                xml={() => this.changeView('xml')}
                help={helpLinks}/>
              <WzSettingsViewer mode='xml' value={currentConfig}/>
            </div>

          </WzViewSelector>
        )}
      </Fragment>
    )
  }
}

const sections = [{component:'integrator',configuration:'integration'}];

export default withWzConfig(sections)(WzConfigurationIntegrations);