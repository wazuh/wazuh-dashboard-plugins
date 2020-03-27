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
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSideNav,
  EuiIcon
} from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';

class WzMenuOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Fix the selected section
      selectedItemName: null
    };

    this.overviewSections = {
      securityInformation: { id: 'securityInformation', text: 'Security information management' },
      auditing: { id: 'auditing', text: 'Auditing and Policy Monitoring' },
      threatDetection: { id: 'threatDetection', text: 'Threat detection and response' },
      regulatoryCompliance: { id: 'regulatoryCompliance', text: 'Regulatory Compliance' },
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
    };

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.section !== this.state.selectedItemName) {
      this.setState({ selectedItemName: nextProps.section });
    }
  }

  componentDidMount() {
  }

  clickMenuItem = section => {
    this.props.closePopover();
    window.location.href = `#/overview/?tab=${section}`;
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.state.selectedItemName === item.id,
      onClick: () => this.clickMenuItem(item.id),
    };
  };

  render() {
    const securityInformation = [
      this.createItem(this.overviewSections.securityInformation, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: [
          this.createItem(this.overviewSections.securityEvents),
          this.createItem(this.overviewSections.fim),
          this.createItem(this.overviewSections.aws),
        ],
      })
    ];

    const auditing = [
      this.createItem(this.overviewSections.auditing, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: [
          this.createItem(this.overviewSections.pm),
          this.createItem(this.overviewSections.audit),
          this.createItem(this.overviewSections.oscap),
          this.createItem(this.overviewSections.ciscat),
        ],
      })
    ];

    const threatDetection = [
      this.createItem(this.overviewSections.threatDetection, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: [
          this.createItem(this.overviewSections.vuls),
          this.createItem(this.overviewSections.virustotal),
          this.createItem(this.overviewSections.osquery),
          this.createItem(this.overviewSections.docker),
          this.createItem(this.overviewSections.mitre)
        ],
      })
    ];


    const regulatoryCompliance = [
      this.createItem(this.overviewSections.regulatoryCompliance, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: [
          this.createItem(this.overviewSections.pci),
          this.createItem(this.overviewSections.gdpr),
          this.createItem(this.overviewSections.hipaa),
          this.createItem(this.overviewSections.nist),
        ],
      })
    ];

    return (
      <div className="WzManagementSideMenu">
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiSideNav
              items={securityInformation}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSideNav
              items={auditing}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiSideNav
              items={threatDetection}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSideNav
              items={regulatoryCompliance}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};


export default connect(mapStateToProps, null)(WzMenuOverview);
