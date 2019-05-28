import React, { Component } from 'react';

import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer
} from '@elastic/eui';

export class WazuhWelcomeCard extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Security Information Management">
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    icon={<EuiIcon size="xl" type="dashboardApp" />}
                    title="Security events"
                    onClick={() => this.props.switchTab('general')}
                    description="Browse through your security alerts, identifying issues and threats in your environment."
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    icon={<EuiIcon size="xl" type="loggingApp" />}
                    title="Integrity monitoring"
                    onClick={() => this.props.switchTab('fim')}
                    description="Alerts related to file changes, including permissions, content, ownership and attributes."
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    icon={<EuiIcon size="xl" type="logoAWSMono" />}
                    title="Amazon AWS"
                    onClick={() => this.props.switchTab('aws')}
                    description="Security events related to your Amazon AWS services, collected directly via AWS API."
                  />
                </EuiFlexItem>
                <EuiFlexItem />
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Auditing and Policy Monitoring">
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    icon={<EuiIcon size="xl" type="advancedSettingsApp" />}
                    title="Policy monitoring"
                    onClick={() => this.props.switchTab('pm')}
                    description="Verify that your systems are configured according to your security policies baseline."
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    icon={<EuiIcon size="xl" type="securityAnalyticsApp" />}
                    title="Security configuration assessment"
                    onClick={() => this.props.switchTab('sca')}
                    description="Scan your assets as part of a configuration assessment audit."
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                {this.props.extensions.audit ? (
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon size="xl" type="monitoringApp" />}
                      title="System auditing"
                      onClick={() => this.props.switchTab('audit')}
                      description="Audit users behavior, monitoring command execution and alerting on access to critical files."
                    />
                  </EuiFlexItem>
                ) : (
                  <EuiFlexItem />
                )}
                {this.props.extensions.oscap ? (
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon size="xl" type="codeApp" />}
                      title="OpenSCAP"
                      onClick={() => this.props.switchTab('oscap')}
                      description="Configuration assessment and automation of compliance monitoring using SCAP checks."
                    />
                  </EuiFlexItem>
                ) : (
                  <EuiFlexItem />
                )}
              </EuiFlexGroup>
              <EuiFlexGroup>
                {this.props.extensions.ciscat ? (
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon size="xl" type="auditbeatApp" />}
                      title="CIS-CAT"
                      onClick={() => this.props.switchTab('ciscat')}
                      description="Configuration assessment using Center of Internet Security scanner and SCAP checks."
                    />
                  </EuiFlexItem>
                ) : (
                  <EuiFlexItem />
                )}
                <EuiFlexItem />
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Threat Detection and Response">
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    icon={<EuiIcon size="xl" type="securityApp" />}
                    title="Vulnerabilities"
                    onClick={() => this.props.switchTab('vuls')}
                    description="Discover what applications in your environment are affected by well-known vulnerabilities."
                  />
                </EuiFlexItem>
                {this.props.extensions.virustotal ? (
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon size="xl" type="savedObjectsApp" />}
                      title="VirusTotal"
                      onClick={() => this.props.switchTab('virustotal')}
                      description="Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API."
                    />
                  </EuiFlexItem>
                ) : (
                  <EuiFlexItem />
                )}
              </EuiFlexGroup>
              <EuiFlexGroup>
                {this.props.extensions.osquery ? (
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon size="xl" type="searchProfilerApp" />}
                      title="Osquery"
                      onClick={() => this.props.switchTab('osquery')}
                      description="Osquery can be used to expose an operating system as a high-performance relational database."
                    />
                  </EuiFlexItem>
                ) : (
                  <EuiFlexItem />
                )}
                {this.props.extensions.docker ? (
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon size="xl" type="spacesApp" />}
                      title="Docker listener"
                      onClick={() => this.props.switchTab('docker')}
                      description="Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events."
                    />
                  </EuiFlexItem>
                ) : (
                  <EuiFlexItem />
                )}
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
          {this.props.extensions.pci || this.props.extensions.gdpr ? (
            <EuiFlexItem>
              <EuiPanel betaBadgeLabel="Regulatory Compliance">
                <EuiSpacer size="m" />
                <EuiFlexGroup>
                  {this.props.extensions.pci ? (
                    <EuiFlexItem>
                      <EuiCard
                        layout="horizontal"
                        icon={<EuiIcon size="xl" type="visTagCloud" />}
                        title="PCI DSS"
                        onClick={() => this.props.switchTab('pci')}
                        description="Global security standard for entities that process, store or transmit payment cardholder data."
                      />
                    </EuiFlexItem>
                  ) : (
                    <EuiFlexItem />
                  )}
                  {this.props.extensions.gdpr ? (
                    <EuiFlexItem>
                      <EuiCard
                        layout="horizontal"
                        icon={<EuiIcon size="xl" type="visBarVertical" />}
                        title="GDPR"
                        onClick={() => this.props.switchTab('gdpr')}
                        description="General Data Protection Regulation (GDPR) sets guidelines for processing of personal data."
                      />
                    </EuiFlexItem>
                  ) : (
                    <EuiFlexItem />
                  )}
                </EuiFlexGroup>
              </EuiPanel>
            </EuiFlexItem>
          ) : (
            <EuiFlexItem />
          )}
        </EuiFlexGroup>
      </div>
    );
  }
}
