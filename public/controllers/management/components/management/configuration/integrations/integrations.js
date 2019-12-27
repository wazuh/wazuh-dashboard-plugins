import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiTitle,
  EuiText,
  EuiHorizontalRule
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import { WzConfigurationSettingsHeaderViewer } from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import { WzSettingsViewer } from '../util-components/code-viewer';
import withWzConfig from '../util-hocs/wz-config';
import { capitalize, isString } from '../utils/utils';

const helpLinks = [
  {text: 'How to integrate Wazuh with external APIs', href: 'https://documentation.wazuh.com/current/user-manual/manager/manual-integration.html'},
  {text: 'VirusTotal integration documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/virustotal-scan/index.html'},
  {text: 'Integration reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/integration.html'}
];

const defaultIntegrations = [
  { title: 'Slack', description: 'Get alerts directly on Slack' },
  { title: 'VirusTotal', description: 'Get notified when malicious software is found'},
  { title: 'PagerDuty', description: 'Get alerts on this streamlined incident resolution software'}
];

const integrationsSettings = [
  { key: 'hook_url', text: 'Hook URL'},
  { key: 'level', text: 'Filter alerts by this level or above' },
  { key: 'rule_id', text: 'Filter alerts by these rule IDs' },
  { key: 'group', text: 'Filter alerts by these rule groupst' },
  { key: 'event_location', text: 'Filter alerts by location (agent, IP or file)' },
  { key: 'alert_format', text: 'Used format to write alerts' }
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
    // TODO: test
    const { view } = this.state;
    const { currentConfig } = this.props;
    const integrations = Object.keys(currentConfig['integrator-integration'].integration);
    return (
      <Fragment>
        <WzConfigurationPath title='Integrations' description='Slack, VirusTotal, PagerDuty and custom integrations with external APIs' path='Integrations' updateConfigurationSection={this.props.updateConfigurationSection}/>
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

export default withWzConfig('000', sections, null, ({ error, updateConfigurationSection }) => {
  return (
    <Fragment>
      <WzConfigurationPath title='Integrations' description='Slack, VirusTotal, PagerDuty and custom integrations with external APIs' path='Integrations' updateConfigurationSection={updateConfigurationSection}/>
      <WzNoConfig error={error.integrations} help={helpLinks}/>
    </Fragment>)
}, (currentConfig) => {
  let error = false;
  if(currentConfig['integrator-integration'] && typeof currentConfig['integrator-integration'] === 'string'){
    error = error || {};
    error.integrations = currentConfig['integrator-integration'];
  }
  if(/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['integrator-integration'])){ // TODO: wazuhNotReadyYet
    error = error || {};
    error.wazuhNotReadyYet = 'Wazuh not ready yet'
  }
  return error
})(WzConfigurationIntegrations);