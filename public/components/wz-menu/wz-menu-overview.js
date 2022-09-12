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
import React, { Component } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon } from '@elastic/eui';
import { connect } from 'react-redux';
import store from '../../redux/store';
import { updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { AppState } from '../../react-services/app-state';
import { AppNavigate } from '../../react-services/app-navigate';
import { getAngularModule } from '../../kibana-services';
import { hasAgentSupportModule } from '../../react-services/wz-agents';
import { WAZUH_MODULES_ID } from '../../../common/constants';
import { WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID } from '../../../common/wazu-menu/wz-menu-overview.cy';

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
        text: 'Security information management',
      },
      auditing: { id: 'auditing', text: 'Auditing and Policy Monitoring' },
      threatDetection: {
        id: 'threatDetection',
        text: 'Threat detection and response',
      },
      regulatoryCompliance: {
        id: 'regulatoryCompliance',
        text: 'Regulatory Compliance',
      },
      general: {
        id: WAZUH_MODULES_ID.SECURITY_EVENTS,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.SECURITY_EVENTS,
        text: 'Security Events',
      },
      fim: {
        id: WAZUH_MODULES_ID.INTEGRITY_MONITORING,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.INTEGRITY_MONITORING,
        text: 'Integrity Monitoring',
      },
      aws: {
        id: WAZUH_MODULES_ID.AMAZON_WEB_SERVICES,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.AMAZON_WEB_SERVICES,
        text: 'Amazon AWS',
      },
      office: {
        id: WAZUH_MODULES_ID.OFFICE_365,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.OFFICE_365,
        text: 'Office 365',
      },
      gcp: {
        id: WAZUH_MODULES_ID.GOOGLE_CLOUD_PLATFORM,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.GOOGLE_CLOUD_PLATFORM,
        text: 'Google Cloud Platform',
      },
      pm: {
        id: WAZUH_MODULES_ID.POLICY_MONITORING,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.POLICY_MONITORING,
        text: 'Policy Monitoring',
      },
      sca: {
        id: WAZUH_MODULES_ID.SECURITY_CONFIGURATION_ASSESSMENT,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.SECURITY_CONFIGURATION_ASSESSMENT,
        text: 'Security configuration assessment',
      },
      audit: {
        id: WAZUH_MODULES_ID.AUDITING,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.AUDITING,
        text: 'System Auditing',
      },
      oscap: {
        id: WAZUH_MODULES_ID.OPEN_SCAP,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.OPEN_SCAP,
        text: 'OpenSCAP',
      },
      ciscat: {
        id: WAZUH_MODULES_ID.CIS_CAT,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.CIS_CAT,
        text: 'CIS-CAT',
      },
      vuls: {
        id: WAZUH_MODULES_ID.VULNERABILITIES,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.VULNERABILITIES,
        text: 'Vulnerabilities',
      },
      virustotal: {
        id: WAZUH_MODULES_ID.VIRUSTOTAL,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.VIRUSTOTAL,
        text: 'VirusTotal',
      },
      osquery: {
        id: WAZUH_MODULES_ID.OSQUERY,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.OSQUERY,
        text: 'Osquery',
      },
      docker: {
        id: WAZUH_MODULES_ID.DOCKER,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.DOCKER,
        text: 'Docker Listener',
      },
      mitre: {
        id: WAZUH_MODULES_ID.MITRE_ATTACK,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.MITRE_ATTACK,
        text: 'MITRE ATT&CK',
      },
      pci: {
        id: WAZUH_MODULES_ID.PCI_DSS,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.PCI_DSS,
        text: 'PCI DSS',
      },
      gdpr: {
        id: WAZUH_MODULES_ID.GDPR,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.GDPR,
        text: 'GDPR',
      },
      hipaa: {
        id: WAZUH_MODULES_ID.HIPAA,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.HIPAA,
        text: 'HIPAA',
      },
      nist: {
        id: WAZUH_MODULES_ID.NIST_800_53,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.NIST_800_53,
        text: 'NIST 800-53',
      },
      tsc: {
        id: WAZUH_MODULES_ID.TSC,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.TSC,
        text: 'TSC',
      },
      github: {
        id: WAZUH_MODULES_ID.GITHUB,
        cyTestId: WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID.GITHUB,
        text: 'GitHub',
      },
    };

    this.securityInformationItems = [
      this.overviewSections.general,
      this.overviewSections.fim,
      this.overviewSections.office,
      this.overviewSections.aws,
      this.overviewSections.gcp,
      this.overviewSections.github
    ];
    this.auditingItems = [
      this.overviewSections.pm,
      this.overviewSections.audit,
      this.overviewSections.oscap,
      this.overviewSections.ciscat,
      this.overviewSections.sca
    ];
    this.threatDetectionItems = [
      this.overviewSections.vuls,
      this.overviewSections.virustotal,
      this.overviewSections.osquery,
      this.overviewSections.docker,
      this.overviewSections.mitre
    ];
    this.regulatoryComplianceItems = [
      this.overviewSections.pci,
      this.overviewSections.gdpr,
      this.overviewSections.hipaa,
      this.overviewSections.nist,
      this.overviewSections.tsc
    ];
  }

  async componentDidMount() {
    const extensions = await AppState.getExtensions(this.currentApi);
    this.setState({ extensions });
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }

  clickMenuItem = (ev, section) => {
    this.props.closePopover();
    const params = { tab: section };
    if (this.props.currentAgentData.id)
      params["agentId"] = this.props.currentAgentData.id;
    if (section === "sca") { // SCA initial tab is inventory
      params["tabView"] = "inventory"
    }

    if (this.props.currentTab !== section) {
      // do not redirect if we already are in that tab
      if (!this.props.isAgent) {
        AppNavigate.navigateToModule(ev, 'overview', params)
      } else {
        if (!this.props.switchTab) {
          this.props.updateCurrentAgentData(this.props.isAgent);
          AppNavigate.navigateToModule(ev, 'overview', params)
        } else {
          this.props.switchTab(section);
        }
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
      'data-test-subj': item.cyTestId,
      isSelected: this.props.currentTab === item.id,
      onClick: () => { },
      onMouseDown: (ev) => this.clickMenuItem(ev, item.id)
    };
  };

  removeSelectedAgent() {
    this.props.updateCurrentAgentData({});
    this.router.reload();
  }

  render() {

    const securityInformation = [
      {
        name: this.overviewSections.securityInformation.text,
        id: this.overviewSections.securityInformation.id,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.securityInformationItems)
      }
    ];

    const auditing = [
      {
        name: this.overviewSections.auditing.text,
        id: this.overviewSections.auditing.id,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.auditingItems)
      }
    ];

    const threatDetection = [
      {
        name: this.overviewSections.threatDetection.text,
        id: this.overviewSections.threatDetection.id,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.threatDetectionItems)
      }
    ];

    const regulatoryCompliance = [
      {
        name: this.overviewSections.regulatoryCompliance.text,
        id: this.overviewSections.regulatoryCompliance.id,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.regulatoryComplianceItems)
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
                <EuiSideNav
                  items={auditing}
                  style={{ padding: '4px 12px' }}
                />
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
)(WzMenuOverview);
