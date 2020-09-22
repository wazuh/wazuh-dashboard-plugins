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
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon, EuiPanel, EuiStat, EuiButton, EuiToolTip } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import store from '../../redux/store';
import chrome from 'ui/chrome';
import { updateCurrentTab, updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { AppState } from '../../react-services/app-state';
import { AppNavigate } from '../../react-services/app-navigate';
import { UnsupportedComponents } from '../../utils/components-os-support';

class WzMenuOverview extends Component {
  constructor(props) {
    super(props);
    this.currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    this.state = {
      extensions: []
    };

    this.overviewSections = {
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

  clickMenuItem = (ev, section) => {
    this.props.closePopover();
    const params = { tab: section };
    if (store.getState().appStateReducers.currentAgentData.id)
      params["agentId"] = store.getState().appStateReducers.currentAgentData.id;
    if (section === "sca") { // SCA initial tab is inventory
      params["tabView"] = "inventory"
    }
    const currentTab = (((store || {}).getState() || {}).appStateReducers || {})
      .currentTab;
    if (currentTab !== section) {
      // do not redirect if we already are in that tab
      if (!this.props.isAgent) {
        AppNavigate.navigateToModule(ev, 'overview', params)
      } else {
        if (!this.props.switchTab) {
          store.dispatch(updateCurrentAgentData(this.props.isAgent));
          AppNavigate.navigateToModule(ev, 'overview', params)
        } else {
          this.props.switchTab(section);
        }
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
      onClick: () => { },
      onMouseDown: (ev) => this.clickMenuItem(ev, item.id)
    };
  };


  color = (status, hex = false) => {
    if (status.toLowerCase() === 'active') { return hex ? '#017D73' : 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return hex ? '#BD271E' : 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return hex ? '#98A2B3' : 'subdued'; }
  }

  removeSelectedAgent() {
    store.dispatch(updateCurrentAgentData({}));
    this.router.reload();
  }

  render() {
    let securityInformationItems = [
      this.overviewSections.general,
      this.overviewSections.fim,
      this.overviewSections.aws,
      this.overviewSections.gcp
    ];
    let auditingItems = [
      this.overviewSections.pm,
      this.overviewSections.ciscat,
      this.overviewSections.sca
    ];
    let threatDetectionItems = [
      this.overviewSections.virustotal,
      this.overviewSections.osquery,
      this.overviewSections.mitre
    ];

    const agent = store.getState().appStateReducers.currentAgentData;

    let platform = false;

    if (Object.keys(agent).length) {
      platform = ((agent.os || {}).uname || '').includes('Linux') ? 'linux' : ((agent.os || {}).platform || false);
    }

    if (!platform || !UnsupportedComponents[platform].includes('audit')) {
      auditingItems.splice(1, 0, this.overviewSections.audit);
      auditingItems.splice(2, 0, this.overviewSections.oscap);
    }
    if (!platform || !UnsupportedComponents[platform].includes('docker')) {
      threatDetectionItems.splice(2, 0, this.overviewSections.docker);
    }
    if (!platform || !UnsupportedComponents[platform].includes('vuls')) {
      threatDetectionItems.unshift(this.overviewSections.vuls);
    }

    const securityInformation = [
      {
        name: this.overviewSections.securityInformation.text,
        id: this.overviewSections.securityInformation.id,
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(securityInformationItems)
      }
    ];

    const auditing = [
      {
        name: this.overviewSections.auditing.text,
        id: this.overviewSections.auditing.id,
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(auditingItems)
      }
    ];

    const threatDetection = [
      {
        name: this.overviewSections.threatDetection.text,
        id: this.overviewSections.threatDetection.id,
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(threatDetectionItems)
      }
    ];

    const regulatoryCompliance = [
      {
        name: this.overviewSections.regulatoryCompliance.text,
        id: this.overviewSections.regulatoryCompliance.id,
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems([
          this.overviewSections.pci,
          this.overviewSections.gdpr,
          this.overviewSections.hipaa,
          this.overviewSections.nist,
          this.overviewSections.tsc
        ])
      }
    ];

    const agentData = store.getState().appStateReducers.currentAgentData

    return (
      <div className="WzManagementSideMenu wz-menu-overview">
        {Object.keys(this.state.extensions).length && (
          <div>
            {!agentData.id && (
              <EuiFlexGroup>
                <EuiFlexItem grow={false} style={{ marginLeft: 14 }}>
                  <EuiButtonEmpty iconType="apps"
                    onClick={() => {
                      this.props.closePopover();
                      window.location.href = '#/overview';
                    }}>
                    Modules directory
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
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
            </EuiFlexGrid>
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
)(WzMenuOverview);
