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
import React, { Component } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon, EuiHorizontalRule, EuiSpacer, EuiButton } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import store from '../../redux/store';
import chrome from 'ui/chrome';
import { updateCurrentTab } from '../../redux/actions/appStateActions';
import { AppState } from '../../react-services/app-state';
import { UnsupportedComponents } from '../../utils/components-os-support';

class WzMenuAgent extends Component {
  constructor(props) {
    super(props);
    this.currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    this.state = {
      extensions: []
    };

    this.agentSections = {
      securityInformation: {
        id: 'securityInformation',
        text: 'Security information management'
      },
      auditing: { id: 'auditing', text: 'Auditing and Policy Monitoring' },
      threatDetection: {
        id: 'threatDetection',
        text: 'Threat detection and response'
      },
      regulatoryCompliance: {
        id: 'regulatoryCompliance',
        text: 'Regulatory Compliance'
      },
      general: { id: 'general', text: 'Security Events' },
      fim: { id: 'fim', text: 'Integrity Monitoring' },
      aws: { id: 'aws', text: 'Amazon AWS' },
      gcp: { id: 'gcp', text: 'Google Cloud Platform' },
      pm: { id: 'pm', text: 'Policy Monitoring' },
      sca: { id: 'sca', text: 'Security configuration assessment' },
      audit: { id: 'audit', text: 'System Auditing' },
      oscap: { id: 'oscap', text: 'OpenSCAP' },
      ciscat: { id: 'ciscat', text: 'CIS-CAT' },
      vuls: { id: 'vuls', text: 'Vulnerabilities' },
      virustotal: { id: 'virustotal', text: 'VirusTotal' },
      osquery: { id: 'osquery', text: 'Osquery' },
      docker: { id: 'docker', text: 'Docker Listener' },
      mitre: { id: 'mitre', text: 'MITRE ATT&CK' },
      pci: { id: 'pci', text: 'PCI DSS' },
      gdpr: { id: 'gdpr', text: 'GDPR' },
      hipaa: { id: 'hipaa', text: 'HIPAA' },
      nist: { id: 'nist', text: 'NIST 800-53' },
      tsc: { id: 'tsc', text: 'TSC' }
    };

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
  }

  async componentDidMount() {
    const extensions = await AppState.getExtensions(this.currentApi);
    this.setState({ extensions });
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
  }

  clickMenuItem = section => {
    this.props.closePopover();
    const currentTab = (((store || {}).getState() || {}).appStateReducers || {})
      .currentTab;
    if (currentTab !== section) {
      if (!this.props.switchTab) {
        window.location.href = `#/agents?agent=${this.props.isAgent}&tab=${section}`;
        this.router.reload();
      } else {
        this.props.switchTab(section);
      }
    }
  };

  createItems = items => {
    let result = [];
    const keyExists = key => Object.keys(this.state.extensions).includes(key);
    const keyIsTrue = key => (this.state.extensions || [])[key];
    items.forEach(item => {
      if (Object.keys(this.state.extensions).length && (!keyExists(item.id) || keyIsTrue(item.id))) {
        result.push(this.createItem(item));
      }
    });
    return result;
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    const currentTab = (((store || {}).getState() || {}).appStateReducers || {})
      .currentTab;
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: currentTab === item.id,
      onClick: () => this.clickMenuItem(item.id)
    };
  };

  render() {
    let securityInformationItems = [
      this.agentSections.general,
      this.agentSections.fim,
      this.agentSections.gcp
    ];
    let auditingItems = [
      this.agentSections.pm,
      this.agentSections.audit,
      this.agentSections.oscap,
      this.agentSections.ciscat
    ];
    let threatDetectionItems = [
      this.agentSections.virustotal,
      this.agentSections.osquery,
      this.agentSections.docker,
      this.agentSections.mitre
    ];
    if (!this.props.isAgent) {
      securityInformationItems.splice(2, 0, this.agentSections.aws);
      threatDetectionItems.unshift(this.agentSections.vuls);
    } else {
      auditingItems.splice(1, 0, this.agentSections.sca);
      // if (!(UnsupportedComponents[this.props.isAgent.agentPlatform] || UnsupportedComponents['other']).includes('vuls')) {
      //   threatDetectionItems.unshift(this.agentSections.vuls);
      // }
    }
    const securityInformation = [
      this.createItem(this.agentSections.securityInformation, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(securityInformationItems)
      })
    ];

    const auditing = [
      this.createItem(this.agentSections.auditing, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(auditingItems)
      })
    ];

    const threatDetection = [
      this.createItem(this.agentSections.threatDetection, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(threatDetectionItems)
      })
    ];

    const regulatoryCompliance = [
      this.createItem(this.agentSections.regulatoryCompliance, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems([
          this.agentSections.pci,
          this.agentSections.gdpr,
          this.agentSections.hipaa,
          this.agentSections.nist,
          this.agentSections.tsc
        ])
      })
    ];

    return (
      <div className="WzManagementSideMenu">
        {Object.keys(this.state.extensions).length && (
          <div>
            {(
              <EuiFlexGroup>
                <EuiFlexItem grow={false} style={{ marginLeft: 16 }}>
                  <EuiButtonEmpty iconType="arrowRight"
                    onClick={() => {
                      this.props.closePopover();
                      window.location.href = '#/agents-preview';
                    }}>
                    Go to Agent welcome
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
            {this.props.isAgent && (
            <EuiFlexGrid columns={2}>
              <EuiFlexItem>
                <EuiSideNav
                  items={securityInformation}
                  style={{ padding: '4px 12px' }}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSideNav items={auditing} style={{ padding: '4px 12px' }} />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSideNav
                  items={threatDetection}
                  style={{ padding: '4px 12px' }}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSideNav
                  items={regulatoryCompliance}
                  style={{ padding: '4px 12px' }}
                />
              </EuiFlexItem>
              <EuiHorizontalRule margin="s" />
              <EuiFlexItem grow={false}>
                <EuiButton
                  onClick={() => this.clickMenuItem('syscollector')}
                  iconType="inspect">
                  <span>Inventory data</span>
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  onClick={() => this.clickMenuItem('configuration')}
                  iconType="gear" >
                  <span>Configuration</span>
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGrid>
            )}
          </div>
        ) || (<div style={{ width: 300 }}></div>
          )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

export default connect(
  mapStateToProps,
  null
)(WzMenuAgent);
