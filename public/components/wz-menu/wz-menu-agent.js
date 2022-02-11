/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon, EuiHorizontalRule, EuiPanel, EuiButton, EuiSpacer } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { AppState } from '../../react-services/app-state';
import { hasAgentSupportModule } from '../../react-services/wz-agents';
import { AgentInfo } from './../common/welcome/agents-info';
import { getAngularModule } from '../../kibana-services';
import { WAZUH_MODULES_ID, UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services'

class WzMenuAgent extends Component {
  constructor(props) {
    super(props);
    this.currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    this.state = {
      extensions: []
    };

    this.agent = false;

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
      general: { id: WAZUH_MODULES_ID.SECURITY_EVENTS, text: 'Security Events' },
      fim: { id: WAZUH_MODULES_ID.INTEGRITY_MONITORING, text: 'Integrity Monitoring' },
      aws: { id: WAZUH_MODULES_ID.AMAZON_WEB_SERVICES, text: 'Amazon AWS' },
      gcp: { id: WAZUH_MODULES_ID.GOOGLE_CLOUD_PLATFORM, text: 'Google Cloud Platform' },
      pm: { id: WAZUH_MODULES_ID.POLICY_MONITORING, text: 'Policy Monitoring' },
      sca: { id: WAZUH_MODULES_ID.SECURITY_CONFIGURATION_ASSESSMENT, text: 'Security configuration assessment' },
      audit: { id: WAZUH_MODULES_ID.AUDITING, text: 'System Auditing' },
      oscap: { id: WAZUH_MODULES_ID.OPEN_SCAP, text: 'OpenSCAP' },
      ciscat: { id: WAZUH_MODULES_ID.CIS_CAT, text: 'CIS-CAT' },
      vuls: { id: WAZUH_MODULES_ID.VULNERABILITIES, text: 'Vulnerabilities' },
      virustotal: { id: WAZUH_MODULES_ID.VIRUSTOTAL, text: 'VirusTotal' },
      osquery: { id: WAZUH_MODULES_ID.OSQUERY, text: 'Osquery' },
      docker: { id: WAZUH_MODULES_ID.DOCKER, text: 'Docker Listener' },
      mitre: { id: WAZUH_MODULES_ID.MITRE_ATTACK, text: 'MITRE ATT&CK' },
      pci: { id: WAZUH_MODULES_ID.PCI_DSS, text: 'PCI DSS' },
      gdpr: { id: WAZUH_MODULES_ID.GDPR, text: 'GDPR' },
      hipaa: { id: WAZUH_MODULES_ID.HIPAA, text: 'HIPAA' },
      nist: { id: WAZUH_MODULES_ID.NIST_800_53, text: 'NIST 800-53' },
      tsc: { id: WAZUH_MODULES_ID.TSC, text: 'TSC' },
      github: {id: WAZUH_MODULES_ID.GITHUB, text: 'GitHub'}
    };

    this.securityInformationItems = [
      this.agentSections.general,
      this.agentSections.fim,
      this.agentSections.gcp,
    ];
    this.auditingItems = [
      this.agentSections.pm,
      this.agentSections.audit,
      this.agentSections.oscap,
      this.agentSections.ciscat,
      this.agentSections.sca
    ];
    this.threatDetectionItems = [
      this.agentSections.vuls,
      this.agentSections.virustotal,
      this.agentSections.osquery,
      this.agentSections.docker,
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

    const dataAgent = await this.getAgentData(this.props.isAgent);
    this.agent = dataAgent.data.data;

    const extensions = await AppState.getExtensions(this.currentApi);
    this.setState({ extensions });
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }


  async getAgentData(agentId) {
    try {
      const result = await WzRequest.apiReq('GET', '/agents/' + agentId, {});
      return result;
    } catch (error) {
      const options = {
        context: `${WzMenuAgent.name}.getAgentData`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }


  clickMenuItem = section => {
    this.props.closePopover();
    if (this.props.currentTab !== section) {
      if (!this.props.switchTab) {
        window.location.href = `#/agents?agent=${this.props.isAgent}&tab=${section}`;
        this.router.reload();
      } else {
        this.props.switchTab(section);
      }
    }
  };

  createItems = items => {
    const keyExists = key => Object.keys(this.state.extensions).includes(key);
    const keyIsTrue = key => (this.state.extensions || [])[key];
    return items.filter(item => 
      (Object.keys(this.props.currentAgentData).length ? hasAgentSupportModule(this.props.currentAgentData, item.id) : true) && Object.keys(this.state.extensions).length && (!keyExists(item.id) || keyIsTrue(item.id))
    ).map(item => this.createItem(item));
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.props.currentTab === item.id,
      onClick: () => this.clickMenuItem(item.id)
    };
  };

  render() {
    const securityInformation = [
      {
        name: this.agentSections.securityInformation.text,
        id: this.agentSections.securityInformation.id,
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.securityInformationItems)
      }
    ];

    const auditing = [
      {
        name: this.agentSections.auditing.text,
        id: this.agentSections.auditing.id,
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.auditingItems)
      }
    ];

    const threatDetection = [
      {
        name: this.agentSections.threatDetection.text,
        id: this.agentSections.threatDetection.id,
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.threatDetectionItems)
      }
    ];

    const regulatoryCompliance = [
      {
        name: this.agentSections.regulatoryCompliance.text,
        id: this.agentSections.regulatoryCompliance.id,
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.regulatoryComplianceItems)
      }
    ];

    return (
      <div className="WzManagementSideMenu">
        {Object.keys(this.state.extensions).length && (
          <div>
            {(
              <Fragment>
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
                <EuiSpacer size='s' />
                <EuiPanel paddingSize='s'>
                  <AgentInfo agent={this.agent} isCondensed={true} hideActions={true} {...this.props}></AgentInfo>
                </EuiPanel>
                <EuiSpacer size='s' />
              </Fragment>
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
    state: state.rulesetReducers,
    currentAgentData: state.appStateReducers.currentAgentData,
    currentTab: state.appStateReducers.currentTab
  };
};

const mapDispatchToProps = dispatch => ({
  updateCurrentAgentData: (agentData) => dispatch(updateCurrentAgentData(agentData))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzMenuAgent);
