/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiFlexGrid,
  EuiCallOut,
  EuiTitle,
  EuiHealth,
  EuiPage,
  EuiButton,
  EuiPopover
} from '@elastic/eui';
import { AgentInfo } from './agents-info';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { UnsupportedComponents } from '../../../utils/components-os-support';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import Overview from '../../wz-menu/wz-menu-overview';
import './welcome.less';

export class AgentsWelcome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      extensions: this.props.extensions
    };
  }

  color = (status, hex = false) => {
    if (status.toLowerCase() === 'active') { return hex ? '#017D73' : 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return hex ? '#BD271E' : 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return hex ? '#98A2B3' : 'subdued'; }
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-agent-title">
          <EuiFlexGroup>
            <EuiFlexItem />
            <EuiFlexItem grow={false} className="wz-module-header-agent-title-badge">
              <span style={{ display: 'inline-flex', paddingLeft: 16 }}>
                <EuiTitle size="s">
                  <h1>
                    <span>{this.props.agent.name}&nbsp;&nbsp;&nbsp;</span>
                  </h1>
                </EuiTitle>
                <EuiHealth style={{ paddingTop: 3 }} size="xl" color={this.color(this.props.agent.status)}>
                  {this.props.agent.status}
                </EuiHealth>
              </span>
            </EuiFlexItem>
            <EuiFlexItem />
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
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

  render() {
    const title = this.renderTitle();
    return (
      <div className="wz-module wz-module-welcome">
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent'>
            {title}
          </div>
        </div>
        <div>
          <div className='wz-module-header-nav-wrapper'>
            <div className='wz-module-header-nav'>
              <div className="wz-welcome-page-agent-info">
                <AgentInfo agent={this.props.agent} hideActions={true} {...this.props}></AgentInfo>
              </div>
            </div>
          </div>
        </div>
        <div className="wz-module-body">
          <EuiPage>
            <EuiFlexGroup className="wz-welcome-page-agent-info-actions">
              <EuiFlexItem grow={false} style={{ marginRight: 0, marginTop: 0 }}>
                <EuiPopover
                  button={
                    <EuiButton
                      onClick={() => this.setState({ switchModule: !this.state.switchModule })} style={{ cursor: 'pointer' }}
                      iconType="apps">
                      <span>Navigation&nbsp;<EuiIcon type='arrowDown'></EuiIcon></span>
                    </EuiButton>
                  }
                  isOpen={this.state.switchModule}
                  closePopover={() => this.setState({ switchModule: false })}
                  repositionOnScroll={true}
                  anchorPosition="downLeft">
                  <WzReduxProvider>
                    <div style={{ maxWidth: 650 }}>
                      <Overview
                        isAgent={this.props.agent}
                        closePopover={() => this.setState({ switchModule: false })}
                        switchTab={(module) => this.props.switchTab(module)}></Overview>
                    </div>
                  </WzReduxProvider>
                </EuiPopover>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginRight: 0, marginTop: 0 }}>
                <EuiButton
                  onClick={() => this.props.switchTab('syscollector')}
                  iconType="inspect">
                  <span>Inventory data</span>
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: 0 }}>
                <EuiButton
                  onClick={() => this.props.switchTab('configuration')}
                  iconType="gear" >
                  <span>Configuration</span>
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPage>
          <EuiSpacer size="s" />
          <EuiPage>
            {/* <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Security Information Management">
                      <EuiFlexGroup gutterSize="xs">
                        <EuiFlexItem />
                      </EuiFlexGroup>
                      <EuiSpacer size="s" />
                      <EuiFlexGrid columns={2}>
                        {this.buildTabCard('general', 'dashboardApp')}
                        {this.buildTabCard('fim', 'filebeatApp')}
                        {this.buildTabCard('gcp', 'logoGCPMono')}
                      </EuiFlexGrid>
                    </EuiPanel>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Auditing and Policy Monitoring">
                      <EuiSpacer size="s" />
                      <EuiFlexGrid columns={2}>
                        {this.buildTabCard('pm', 'advancedSettingsApp')}
                        {this.buildTabCard('sca', 'securityAnalyticsApp')}
                        {this.props.extensions.audit &&
                          this.buildTabCard('audit', 'monitoringApp')}
                        {this.props.extensions.oscap &&
                          this.buildTabCard('oscap', 'codeApp')}
                        {this.props.extensions.ciscat &&
                          this.buildTabCard('ciscat', 'auditbeatApp')}
                      </EuiFlexGrid>
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="xl" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Threat Detection and Response">
                      <EuiSpacer size="s" />
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
                                    Click the <EuiIcon type="eye" /> icon to
                                    show thread detection and response
                                    extensions.
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
                          UnsupportedComponents[
                          this.props.agent.agentPlatform
                          ] || UnsupportedComponents['other']
                        ).includes('vuls') &&
                          this.buildTabCard('vuls', 'securityApp')}
                        {this.props.extensions.virustotal &&
                          this.buildTabCard('virustotal', 'savedObjectsApp')}
                        {this.props.extensions.osquery &&
                          this.buildTabCard('osquery', 'searchProfilerApp')}
                        {this.props.extensions.docker &&
                          this.buildTabCard('docker', 'logoDocker')}
                        {this.props.extensions.mitre &&
                          this.buildTabCard('mitre', 'spacesApp')}{' '}
                      </EuiFlexGrid>
                    </EuiPanel>
                  </EuiFlexItem>

                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Regulatory Compliance">
                      <EuiSpacer size="s" />
                      {!this.props.extensions.pci &&
                        !this.props.extensions.gdpr &&
                        !this.props.extensions.hipaa &&
                        !this.props.extensions.nist && (
                          <EuiFlexGroup>
                            <EuiFlexItem>
                              <EuiCallOut
                                title={
                                  <p>
                                    Click the <EuiIcon type="eye" /> icon to
                                    show regulatory compliance extensions.
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
                        this.props.extensions.nist ||
                        this.props.extensions.tsc) && (
                          <EuiFlexGrid columns={2}>
                            {this.props.extensions.pci &&
                              this.buildTabCard('pci', 'visTagCloud')}
                            {this.props.extensions.nist &&
                              this.buildTabCard('nist', 'apmApp')}
                            {this.props.extensions.gdpr &&
                              this.buildTabCard('gdpr', 'visBarVertical')}
                            {this.props.extensions.hipaa &&
                              this.buildTabCard('hipaa', 'emsApp')}
                            {this.props.extensions.tsc &&
                              this.buildTabCard('tsc', 'apmApp')}
                          </EuiFlexGrid>
                        )}
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup> */}
          </EuiPage>
        </div>
      </div>
    );
  }
}
