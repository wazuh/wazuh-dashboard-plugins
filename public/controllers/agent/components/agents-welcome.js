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
import React, { Component, Fragment } from 'react';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiFlexGrid,
  EuiCallOut,
  EuiPage,
  EuiButton
} from '@elastic/eui';

import { TabDescription } from '../../../../server/reporting/tab-description';
import { UnsupportedComponents } from '../../../utils/components-os-support';

export class WelcomeScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      extensions: this.props.extensions
    };
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
    return (
      <Fragment>
        <EuiPage>
          <EuiFlexGroup>
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
                      {this.buildTabCard('configuration', 'gear')}
                      {this.buildTabCard('syscollector', 'notebookApp')}
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
                                  Click the <EuiIcon type="eye" /> icon to show
                                  thread detection and response extensions.
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
                      {/* TODO- Change "spacesApp" icon*/}
                    </EuiFlexGrid>
                  </EuiPanel>
                </EuiFlexItem>

                <EuiFlexItem>
                  <EuiPanel betaBadgeLabel="Regulatory Compliance">
                    <EuiSpacer size="s" />
                    {!this.props.extensions.pci &&
                      !this.props.extensions.gdpr &&
                      !this.props.extensions.hipaa &&
                      !this.props.extensions.tsc &&
                      !this.props.extensions.nist && (
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiCallOut
                              title={
                                <p>
                                  Click the <EuiIcon type="eye" /> icon to show
                                  regulatory compliance extensions.
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
                      this.props.extensions.tsc ||
                      this.props.extensions.nist) && (
                      <EuiFlexGrid columns={2}>
                        {this.props.extensions.pci &&
                          this.buildTabCard('pci', 'visTagCloud')}
                        {this.props.extensions.nist &&
                          this.buildTabCard('nist', 'apmApp')}
                        {this.props.extensions.tsc &&
                          this.buildTabCard('tsc', 'apmApp')}
                        {this.props.extensions.gdpr &&
                          this.buildTabCard('gdpr', 'visBarVertical')}
                        {this.props.extensions.hipaa &&
                          this.buildTabCard('hipaa', 'emsApp')}
                      </EuiFlexGrid>
                    )}
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPage>
        <EuiPage>
          <EuiFlexGroup justifyContent="spaceAround">
            <EuiFlexItem grow={false}>
              <EuiButton
                onClick={() =>
                  (window.location.href = '#/settings?tab=modules')
                }
                iconType="eye"
              >
                Configure the modules
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPage>
      </Fragment>
    );
  }
}
