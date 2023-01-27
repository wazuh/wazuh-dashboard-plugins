/*
 * Wazuh app - React component for show configuration of integrations.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import { WzConfigurationSettingsHeaderViewer } from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import { WzSettingsViewer } from '../util-components/code-viewer';
import WzViewSelector, {
  WzViewSelectorSwitch
} from '../util-components/view-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import withWzConfig from '../util-hocs/wz-config';
import { capitalize, isString } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Integration with external APIs',
    href: webDocumentationLink('user-manual/manager/manual-integration.html')
  },
  {
    text: 'VirusTotal integration',
    href: webDocumentationLink('user-manual/capabilities/virustotal-scan/index.html')
  },
  {
    text: 'Integration reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/integration.html')
  }
];

const defaultIntegrations = [
  { title: 'Slack', description: 'Get alerts directly on Slack' },
  {
    title: 'VirusTotal',
    description: 'Get notified when malicious software is found'
  },
  {
    title: 'PagerDuty',
    description: 'Get alerts on this streamlined incident resolution software'
  }
];

const integrationsSettings = [
  { field: 'hook_url', label: 'Hook URL' },
  { field: 'level', label: 'Filter alerts by this level or above' },
  { field: 'rule_id', label: 'Filter alerts by these rule IDs' },
  { field: 'group', label: 'Filter alerts by these rule groupst' },
  {
    field: 'event_location',
    label: 'Filter alerts by location (agent, IP address or file)'
  },
  { field: 'alert_format', label: 'Used format to write alerts' }
];

class WzConfigurationIntegrations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: ''
    };
  }
  changeView(view) {
    this.setState({ view });
  }
  buildIntegration(integration) {
    return (
      defaultIntegrations.find(
        i => i.title && i.title.toLocaleLowerCase() === integration
      ) || { title: capitalize(integration), description: 'Custom integration' }
    );
  }
  render() {
    const { view } = this.state;
    const { currentConfig } = this.props;
    const integrations =
      currentConfig['integrator-integration'] &&
      currentConfig['integrator-integration'].integration
        ? currentConfig['integrator-integration'].integration
        : false;
    return (
      <Fragment>
        {currentConfig['integrator-integration'] &&
          isString(currentConfig['integrator-integration']) && (
            <WzNoConfig
              error={currentConfig['integrator-integration']}
              help={helpLinks}
            />
          )}
        {currentConfig['integrator-integration'] &&
          !isString(currentConfig['integrator-integration']) && (
            //   <WzConfigurationSettingsTabSelector
            //     title='Main settings'
            //     description='Basic alerts and logging settings'
            //     currentConfig={currentConfig}
            //     helpLinks={helpLinks}>
            // </WzConfigurationSettingsTabSelector>
            <WzViewSelector view={view}>
              <WzViewSelectorSwitch default>
                {integrations &&
                  integrations.map((integrationInfo, key) => {
                    const integration = Object.assign(
                      this.buildIntegration(integrationInfo.name),
                      integrationInfo
                    );
                    return (
                      <Fragment key={`integration-${integration.title}`}>
                        <WzConfigurationSettingsGroup
                          title={integration.title}
                          description={integration.description}
                          items={integrationsSettings}
                          config={integration}
                          viewSelected={view}
                          settings={
                            key === 0 ? () => this.changeView('') : undefined
                          }
                          json={
                            key === 0
                              ? () => this.changeView('json')
                              : undefined
                          }
                          xml={
                            key === 0 ? () => this.changeView('xml') : undefined
                          }
                          help={key === 0 ? helpLinks : undefined}
                        />
                      </Fragment>
                    );
                  })}
              </WzViewSelectorSwitch>
              <WzViewSelectorSwitch view="json">
                <WzConfigurationSettingsHeaderViewer
                  mode="json"
                  viewSelected={view}
                  settings={() => this.changeView('')}
                  json={() => this.changeView('json')}
                  xml={() => this.changeView('xml')}
                  help={helpLinks}
                />
                <WzSettingsViewer
                  mode="json"
                  value={currentConfig}
                  minusHeight={260}
                />
              </WzViewSelectorSwitch>
              <WzViewSelectorSwitch view="xml">
                <WzConfigurationSettingsHeaderViewer
                  mode="xml"
                  viewSelected={view}
                  settings={() => this.changeView('')}
                  json={() => this.changeView('json')}
                  xml={() => this.changeView('xml')}
                  help={helpLinks}
                />
                <WzSettingsViewer
                  mode="xml"
                  value={currentConfig}
                  minusHeight={260}
                />
              </WzViewSelectorSwitch>
            </WzViewSelector>
          )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'integrator', configuration: 'integration' }];

// WzConfigurationIntegrations.propTypes = {
//   currentConfig: PropTypes.object.isRequired
// };

export default withWzConfig(sections)(WzConfigurationIntegrations);
