/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon, EuiButtonIcon } from '@elastic/eui';
import { connect } from 'react-redux';
import { AppState } from '../../../../react-services/app-state';
import { hasAgentSupportModule } from '../../../../react-services/wz-agents';
import { getAngularModule, getToasts } from '../../../../kibana-services';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';

class WzMenuAgent extends Component {
  constructor(props) {
    super(props);
    this.currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    this.state = {
      extensions: [],
      hoverAddFilter: '',
    };

    this.menuAgent = window.localStorage.getItem('menuAgent') ? JSON.parse(window.localStorage.getItem('menuAgent')) : {};

    this.agentSections = {
      securityInformation: {
        id: 'securityInformation',
        text: 'Security information management',
        isTitle: true
      },
      auditing: { 
        id: 'auditing', 
        text: 'Auditing and Policy Monitoring',
        isTitle: true
      },
      threatDetection: {
        id: 'threatDetection',
        text: 'Threat detection and response',
        isTitle: true
      },
      regulatoryCompliance: {
        id: 'regulatoryCompliance',
        text: 'Regulatory Compliance',
        isTitle: true
      },
      general: { id: WAZUH_MODULES_ID.SECURITY_EVENTS, text: 'Security events', isPin: this.menuAgent.general ? this.menuAgent.general : false },
      fim: { id: WAZUH_MODULES_ID.INTEGRITY_MONITORING, text: 'Integrity monitoring', isPin: this.menuAgent.fim ? this.menuAgent.fim : false },
      aws: { id: WAZUH_MODULES_ID.AMAZON_WEB_SERVICES, text: 'Amazon AWS', isPin: this.menuAgent.aws ? this.menuAgent.aws : false },
      gcp: { id: WAZUH_MODULES_ID.GOOGLE_CLOUD_PLATFORM, text: 'Google Cloud Platform', isPin: this.menuAgent.gcp ? this.menuAgent.gcp : false },
      pm: { id: WAZUH_MODULES_ID.POLICY_MONITORING, text: 'Policy Monitoring', isPin: this.menuAgent.pm ? this.menuAgent.pm : false },
      sca: { id: WAZUH_MODULES_ID.SECURITY_CONFIGURATION_ASSESSMENT, text: 'Security configuration assessment', isPin: this.menuAgent.sca ? this.menuAgent.sca : false },
      audit: { id: WAZUH_MODULES_ID.AUDITING, text: 'System Auditing', isPin: this.menuAgent.audit ? this.menuAgent.audit : false },
      oscap: { id: WAZUH_MODULES_ID.OPEN_SCAP, text: 'OpenSCAP', isPin: this.menuAgent.oscap ? this.menuAgent.oscap : false },
      ciscat: { id: WAZUH_MODULES_ID.CIS_CAT, text: 'CIS-CAT', isPin: this.menuAgent.oscap ? this.menuAgent.oscap : false },
      vuls: { id: WAZUH_MODULES_ID.VULNERABILITIES, text: 'Vulnerabilities', isPin: this.menuAgent.vuls ? this.menuAgent.vuls : false },
      virustotal: { id: WAZUH_MODULES_ID.VIRUSTOTAL, text: 'VirusTotal', isPin: this.menuAgent.virustotal ? this.menuAgent.virustotal : false },
      osquery: { id: WAZUH_MODULES_ID.OSQUERY, text: 'Osquery', isPin: this.menuAgent.osquery ? this.menuAgent.osquery : false },
      docker: { id: WAZUH_MODULES_ID.DOCKER, text: 'Docker Listener', isPin: this.menuAgent.docker ? this.menuAgent.docker : false },
      mitre: { id: WAZUH_MODULES_ID.MITRE_ATTACK, text: 'MITRE ATT&CK', isPin: this.menuAgent.mitre ? this.menuAgent.mitre : false },
      pci: { id: WAZUH_MODULES_ID.PCI_DSS, text: 'PCI DSS', isPin: this.menuAgent.pci ? this.menuAgent.pci : false },
      gdpr: { id: WAZUH_MODULES_ID.GDPR, text: 'GDPR', isPin: this.menuAgent.gdpr ? this.menuAgent.gdpr : false },
      hipaa: { id: WAZUH_MODULES_ID.HIPAA, text: 'HIPAA', isPin: this.menuAgent.hipaa ? this.menuAgent.hipaa : false },
      nist: { id: WAZUH_MODULES_ID.NIST_800_53, text: 'NIST 800-53', isPin: this.menuAgent.nist ? this.menuAgent.nist : false },
      tsc: { id: WAZUH_MODULES_ID.TSC, text: 'TSC', isPin: this.menuAgent.tsc ? this.menuAgent.tsc : false }
    };

    this.securityInformationItems = [
      this.agentSections.general,
      this.agentSections.fim,
      this.agentSections.aws,
      this.agentSections.gcp
    ];
    this.auditingItems = [
      this.agentSections.pm,
      this.agentSections.ciscat,
      this.agentSections.sca
    ];
    this.threatDetectionItems = [
      this.agentSections.virustotal,
      this.agentSections.osquery,
      this.agentSections.mitre
    ];
    this.regulatoryComplianceItems = [
      this.agentSections.pci,
      this.agentSections.gdpr,
      this.agentSections.hipaa,
      this.agentSections.nist,
      this.agentSections.tsc
    ];
  }


  async componentDidMount() {
    const extensions = await AppState.getExtensions(this.currentApi);
    this.setState({ extensions });
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }

  clickMenuItem = section => {
    this.props.closePopover();
    if (this.props.currentTab !== section) {
      // do not redirect if we already are in that tab
      window.location.href = `#/overview/?tab=${section}`;
      this.props.updateCurrentAgentData(this.props.isAgent);
      this.router.reload();
    }
  };

  addToast({color, title, text, time = 3000}){
    getToasts().add({title, text, toastLifeTimeMs: time, color})
  }

  createItems = items => {
    const keyExists = key => Object.keys(this.state.extensions).includes(key);
    const keyIsTrue = key => (this.state.extensions || [])[key];
    return items.filter(item => 
      hasAgentSupportModule(this.props.currentAgentData, item.id) && Object.keys(this.state.extensions).length && (!keyExists(item.id) || keyIsTrue(item.id))
    ).map(item => this.createItem(item));
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: 
      <EuiFlexGroup 
        onMouseEnter={() => {
          this.setState({ hoverAddFilter: item.id });
        }}
        onMouseLeave={() => {
          this.setState({ hoverAddFilter: '' });
        }}>
        <EuiFlexItem 
          onClick={() => !item.isTitle ? this.clickMenuItem(item.id) : null}
          style={{ cursor: !item.isTitle ? 'pointer': 'normal' }}>
          {item.text}
        </EuiFlexItem>
        {
          this.state.hoverAddFilter === item.id && !item.isTitle && 
          (Object.keys(this.menuAgent).length < 6 || item.isPin) &&
          (Object.keys(this.menuAgent).length > 1 || !item.isPin) &&
            <EuiFlexItem grow={false}>
              <EuiIcon
              onClick={() => {
                this.menuAgent = window.localStorage.getItem('menuAgent') ? JSON.parse(window.localStorage.getItem('menuAgent')) : {};
                if(!item.isPin && Object.keys(this.menuAgent).length < 6) {
                  this.menuAgent[item.id] = item;
                  item.isPin = true;
                } else if(this.menuAgent[item.id]){
                  delete this.menuAgent[item.id];
                  item.isPin = false;
                } else {
                  this.addToast({
                    title: 'The limit of pinned modules has been reached',
                    color: 'danger'
                  });
                }
                window.localStorage.setItem('menuAgent', JSON.stringify(this.menuAgent));
                this.props.updateMenuAgents();
              }}
              color='primary'
              type={this.menuAgent[item.id] ? 'pinFilled' : 'pin'}
              aria-label="Next"
              style={{ cursor: 'pointer' }}
              />
            </EuiFlexItem>
        }
      </EuiFlexGroup> ,
      isSelected: this.props.currentTab === item.id
    };
  };

  render() {
    const securityInformation = [
      this.createItem(this.agentSections.securityInformation, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.securityInformationItems)
      })
    ];

    const auditing = [
      this.createItem(this.agentSections.auditing, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.auditingItems)
      })
    ];

    const threatDetection = [
      this.createItem(this.agentSections.threatDetection, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.threatDetectionItems)
      })
    ];

    const regulatoryCompliance = [
      this.createItem(this.agentSections.regulatoryCompliance, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.regulatoryComplianceItems)
      })
    ];

    return (
      <div className="WzManagementSideMenu">
        {Object.keys(this.state.extensions).length && (
          <div>
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
    state: state.rulesetReducers,
    currentAgentData: state.appStateReducers.currentAgentData,
    currentTab: state.appStateReducers.currentTab
  };
};

export default connect(
  mapStateToProps,
  null
)(WzMenuAgent);
