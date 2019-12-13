/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiSwitch,
  EuiPopover,
  EuiButtonIcon,
  EuiFormRow,
  EuiFlexGrid,
  EuiCallOut,
  EuiTitle,
} from '@elastic/eui';

import { TabDescription } from '../../../../server/reporting/tab-description';
import { UnsupportedComponents } from '../../../utils/components-os-support';

export class WelcomeScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      extensions: this.props.extensions,
    };
  }

  onButtonClick(btn) {
    this.setState({
      [btn]: !this.state[btn],
    });
  }

  closePopover(popover) {
    this.setState({
      [popover]: false,
    });
  }

  toggleExtension(extension) {
    const extensions = this.state.extensions;
    extensions[extension] = !extensions[extension];
    this.setState({
      extensions,
    });
    try {
      const api = JSON.parse(this.props.api).id;
      api && this.props.setExtensions(api, extensions);
    } catch (error) {} //eslint-disable-line
  }

  buildTabCard(tab, icon) {
    return (
      <EuiFlexItem>
        <EuiCard
          size="xs"
          layout="horizontal"
          icon={<EuiIcon size="xl" type={icon} color="primary" />}
          className="homSynopsis__card"
          title={TabDescription[tab].title}
          onClick={() => this.props.switchTab(tab)}
          description={TabDescription[tab].description}
        />
      </EuiFlexItem>
    );
  }

  buildPopover(popoverName, extensions) {
    const switches = extensions
      .filter(extension => this.props.extensions[extension] !== undefined)
      .map(extension => {
        return (
          <EuiFormRow key={extension}>
            <EuiSwitch
              label={`${TabDescription[extension].title} extension`}
              checked={this.state.extensions[extension]}
              onChange={() => this.toggleExtension(extension)}
            />
          </EuiFormRow>
        );
      });

    return (
      <EuiPopover
        id={popoverName}
        button={
          <EuiButtonIcon
            aria-label="Extensions"
            iconType="eye"
            onClick={() => this.onButtonClick(popoverName)}
          />
        }
        isOpen={this.state[popoverName]}
        closePopover={() => this.closePopover(popoverName)}
      >
        {switches}
      </EuiPopover>
    );
  }

  render() {
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem>
                  <EuiTitle size="s">
                    <h2>Security Information Management</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="l" />
              <EuiFlexGrid columns={2}>
                {this.buildTabCard('general', 'dashboardApp')}
                {this.buildTabCard('fim', 'loggingApp')}
                {this.buildTabCard('configuration', 'gear')}
                {this.buildTabCard('syscollector', 'notebookApp')}
              </EuiFlexGrid>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem>
                  <EuiTitle size="s">
                    <h2>Auditing and Policy Monitoring</h2>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {this.buildPopover('popoverAuditing', ['audit', 'oscap', 'ciscat'])}
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="l" />
              <EuiFlexGrid columns={2}>
                {this.buildTabCard('pm', 'advancedSettingsApp')}
                {this.buildTabCard('sca', 'securityAnalyticsApp')}
                {this.props.extensions.audit && this.buildTabCard('audit', 'monitoringApp')}
                {this.props.extensions.oscap && this.buildTabCard('oscap', 'codeApp')}
                {this.props.extensions.ciscat && this.buildTabCard('ciscat', 'auditbeatApp')}
              </EuiFlexGrid>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem>
                  <EuiTitle size="s">
                    <h2>Threat Detection and Response</h2>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {this.buildPopover('popoverThreat', [
                    'virustotal',
                    'osquery',
                    'docker',
                    'mitre'
                  ])}
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="l" />
              {(
                UnsupportedComponents[this.props.agent.agentPlatform] ||
                UnsupportedComponents['other']
              ).includes('vuls') &&
                !this.props.extensions.virustotal &&
                !this.props.extensions.osquery &&
                !this.props.extensions.mitre &&
                !this.props.extensions.docker && (
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiCallOut
                        title={
                          <p>
                            Click the <EuiIcon type="eye" /> icon to show thread detection and
                            response extensions.
                          </p>
                        }
                        color="success"
                        iconType="help"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              <EuiFlexGrid columns={2}>
                {!(
                  UnsupportedComponents[this.props.agent.agentPlatform] ||
                  UnsupportedComponents['other']
                ).includes('vuls') && this.buildTabCard('vuls', 'securityApp')}
                {this.props.extensions.virustotal &&
                  this.buildTabCard('virustotal', 'savedObjectsApp')}
                {this.props.extensions.osquery &&
                  this.buildTabCard('osquery', 'searchProfilerApp')}
                {this.props.extensions.docker &&
                  this.buildTabCard('docker', 'spacesApp')}
                {this.props.extensions.mitre &&
                  this.buildTabCard('mitre', 'spacesApp')} {/* TODO- Change "spacesApp" icon*/}
              </EuiFlexGrid>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem>
                  <EuiTitle size="s">
                    <h2>Regulatory Compliance</h2>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {this.buildPopover('popoverRegulatory', ['pci', 'gdpr', 'hipaa', 'nist'])}
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="l" />
              {!this.props.extensions.pci &&
                !this.props.extensions.gdpr &&
                !this.props.extensions.hipaa &&
                !this.props.extensions.nist && (
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiCallOut
                        title={
                          <p>
                            Click the <EuiIcon type="eye" /> icon to show regulatory compliance
                            extensions.
                          </p>
                        }
                        color="success"
                        iconType="help"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              {(this.props.extensions.pci ||
                this.props.extensions.gdpr ||
                this.props.extensions.hipaa ||
                this.props.extensions.nist) && (
                <EuiFlexGrid columns={2}>
                  {this.props.extensions.pci && this.buildTabCard('pci', 'visTagCloud')}
                  {this.props.extensions.gdpr && this.buildTabCard('gdpr', 'visBarVertical')}
                  {this.props.extensions.hipaa && this.buildTabCard('hipaa', 'emsApp')}
                  {this.props.extensions.nist && this.buildTabCard('nist', 'apmApp')}
                </EuiFlexGrid>
              )}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

WelcomeScreen.propTypes = {
  extensions: PropTypes.object,
  agent: PropTypes.object,
  setExtensions: PropTypes.func,
  switchTab: PropTypes.func,
  api: PropTypes.string,
};
