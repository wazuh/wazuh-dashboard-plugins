import React, { Component } from 'react';

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
  EuiFlexGrid
} from '@elastic/eui';

import { TabDescription } from '../../server/reporting/tab-description';

export class WazuhWelcomeCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      extensions: this.props.extensions
    };
  }

  onButtonClick(btn) {
    this.setState({
      [btn]: !this.state[btn]
    });
  }

  closePopover(popover) {
    this.setState({
      [popover]: false
    });
  }

  toggleExtension(extension) {
    const extensions = this.state.extensions;
    extensions[extension] = !extensions[extension];
    this.setState({
      extensions
    });
  }

  buildTabCard(tab, icon) {
    return (
      <EuiFlexItem>
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type={icon} />}
          title={TabDescription[tab].title}
          onClick={() => this.props.switchTab(tab)}
          description={TabDescription[tab].description}
        />
      </EuiFlexItem>
    );
  }

  render() {
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Security Information Management">
              <EuiFlexGroup gutterSize="xs"> 
                <EuiFlexItem />
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    id="popover"
                    button={
                      <EuiButtonIcon
                        iconType="eye"
                        onClick={() => this.onButtonClick('popoverSecurity')}
                      />
                    }
                    isOpen={this.state.popoverSecurity}
                    closePopover={() => this.closePopover('popoverSecurity')}
                  >
                    <EuiSwitch
                      label="AWS extension"
                      checked={this.state.extensions.aws}
                      onChange={() => this.toggleExtension('aws')}
                    />
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGrid columns={2}>
                {this.buildTabCard('general', 'dashboardApp')}
                {this.buildTabCard('fim', 'loggingApp')}
                {this.props.extensions.aws &&
                  this.buildTabCard('aws', 'logoAWSMono')}
              </EuiFlexGrid>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Auditing and Policy Monitoring">
              <EuiFlexGroup gutterSize="xs"> 
                <EuiFlexItem />
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    id="popover"
                    button={
                      <EuiButtonIcon
                        iconType="eye"
                        onClick={() => this.onButtonClick('popoverAuditing')}
                      />
                    }
                    isOpen={this.state.popoverAuditing}
                    closePopover={() => this.closePopover('popoverAuditing')}
                  >
                    <EuiFormRow>
                      <EuiSwitch
                        label="System auditing extension"
                        checked={this.state.extensions.audit}
                        onChange={() => this.toggleExtension('audit')}
                      />
                    </EuiFormRow>
                    <EuiFormRow>
                      <EuiSwitch
                        label="OpenSCAP extension"
                        checked={this.state.extensions.oscap}
                        onChange={() => this.toggleExtension('oscap')}
                      />
                    </EuiFormRow>
                    <EuiFormRow>
                      <EuiSwitch
                        label="CIS-CAT extension"
                        checked={this.state.extensions.ciscat}
                        onChange={() => this.toggleExtension('ciscat')}
                      />
                    </EuiFormRow>
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
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
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem />
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    id="popover"
                    button={
                      <EuiButtonIcon
                        iconType="eye"
                        onClick={() => this.onButtonClick('popoverThreat')}
                      />
                    }
                    isOpen={this.state.popoverThreat}
                    closePopover={() => this.closePopover('popoverThreat')}
                  >
                    <EuiFormRow>
                      <EuiSwitch
                        label="Virustotal extension"
                        checked={this.state.extensions.virustotal}
                        onChange={() => this.toggleExtension('virustotal')}
                      />
                    </EuiFormRow>
                    <EuiFormRow>
                      <EuiSwitch
                        label="Osquery extension"
                        checked={this.state.extensions.osquery}
                        onChange={() => this.toggleExtension('osquery')}
                      />
                    </EuiFormRow>
                    <EuiFormRow>
                      <EuiSwitch
                        label="Docker listener extension"
                        checked={this.state.extensions.docker}
                        onChange={() => this.toggleExtension('docker')}
                      />
                    </EuiFormRow>
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGrid columns={2}>
                {this.buildTabCard('vuls', 'securityApp')}
                {this.props.extensions.virustotal &&
                  this.buildTabCard('virustotal', 'savedObjectsApp')}
                {this.props.extensions.osquery &&
                  this.buildTabCard('osquery', 'searchProfilerApp')}
                {this.props.extensions.docker &&
                  this.buildTabCard('docker', 'spacesApp')}
              </EuiFlexGrid>
            </EuiPanel>
          </EuiFlexItem>

          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Regulatory Compliance">
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem />
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    id="popover"
                    button={
                      <EuiButtonIcon
                        iconType="eye"
                        onClick={() => this.onButtonClick('popoverRegulatory')}
                      />
                    }
                    isOpen={this.state.popoverRegulatory}
                    closePopover={() => this.closePopover('popoverRegulatory')}
                  >
                    <EuiFormRow>
                      <EuiSwitch
                        label="PCI DSS extension"
                        checked={this.state.extensions.pci}
                        onChange={() => this.toggleExtension('pci')}
                      />
                    </EuiFormRow>
                    <EuiFormRow>
                      <EuiSwitch
                        label="GDPR extension"
                        checked={this.state.extensions.gdpr}
                        onChange={() => this.toggleExtension('gdpr')}
                      />
                    </EuiFormRow>
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGrid columns={2}>
                {this.props.extensions.pci &&
                  this.buildTabCard('pci', 'visTagCloud')}
                {this.props.extensions.gdpr &&
                  this.buildTabCard('gdpr', 'visBarVertical')}
                {!this.props.extensions.pci && !this.props.extensions.gdpr && (
                  <EuiFlexItem>
                    <p>
                      Click the <EuiIcon type="eye" /> icon to show regulatory
                      compliance extensions.
                    </p>
                  </EuiFlexItem>
                )}
              </EuiFlexGrid>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}
