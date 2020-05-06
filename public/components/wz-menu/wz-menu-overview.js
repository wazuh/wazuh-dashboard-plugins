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
import { EuiFlexItem, EuiFlexGrid, EuiSideNav, EuiIcon } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import store from '../../redux/store';
import { updateCurrentTab } from '../../redux/actions/appStateActions';
import { AppState } from '../../react-services/app-state';

class WzMenuOverview extends Component {
  constructor(props) {
    super(props);
    this.currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    const extensions = AppState.getExtensions(this.currentApi);
    this.state = {
      extensions
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
      pm: { id: 'pm', text: 'Policy Monitoring' },
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

  componentDidMount() {}

  clickMenuItem = section => {
    this.props.closePopover();
    const currentTab = (((store || {}).getState() || {}).appStateReducers || {})
      .currentTab;
    if (currentTab !== section) {
      // do not redirect if we already are in that tab
      window.location.href = `#/overview/?tab=${section}`;
      store.dispatch(updateCurrentTab(section));
    }
  };

  createItems = items => {
    let result = [];
    const keyExists = key => Object.keys(this.state.extensions).includes(key);
    const keyIsTrue = key => (this.state.extensions || [])[key];
    items.forEach(item => {
      if (!keyExists(item.id) || keyIsTrue(item.id)) {
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
    const securityInformation = [
      this.createItem(this.overviewSections.securityInformation, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems([
          this.overviewSections.general,
          this.overviewSections.fim,
          this.overviewSections.aws
        ])
      })
    ];

    const auditing = [
      this.createItem(this.overviewSections.auditing, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems([
          this.overviewSections.pm,
          this.overviewSections.audit,
          this.overviewSections.oscap,
          this.overviewSections.ciscat
        ])
      })
    ];

    const threatDetection = [
      this.createItem(this.overviewSections.threatDetection, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems([
          this.overviewSections.vuls,
          this.overviewSections.virustotal,
          this.overviewSections.osquery,
          this.overviewSections.docker,
          this.overviewSections.mitre
        ])
      })
    ];

    const regulatoryCompliance = [
      this.createItem(this.overviewSections.regulatoryCompliance, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems([
          this.overviewSections.pci,
          this.overviewSections.gdpr,
          this.overviewSections.hipaa,
          this.overviewSections.nist,
          this.overviewSections.tsc
        ])
      })
    ];

    return (
      <div className="WzManagementSideMenu">
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
