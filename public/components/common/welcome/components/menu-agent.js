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
import { EuiFlexGroup, EuiFlexItem, EuiFlexGrid, EuiButtonEmpty, EuiSideNav, EuiIcon, EuiButtonIcon } from '@elastic/eui';
import { WzRequest } from './../../../../react-services/wz-request';
import { connect } from 'react-redux';
import store from './../../../../redux/store';
import chrome from 'ui/chrome';
import { updateCurrentTab } from './../../../../redux/actions/appStateActions';
import { AppState } from './../../../../react-services/app-state';
import { UnsupportedComponents } from './../../../../utils/components-os-support';
import { toastNotifications } from 'ui/notify';

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
      general: { id: 'general', text: 'Security events', isPin: true, default: true },
      fim: { id: 'fim', text: 'Integrity monitoring', isPin: true, default: true },
      aws: { id: 'aws', text: 'Amazon AWS', isPin: this.menuAgent.aws ? this.menuAgent.aws : false },
      gcp: { id: 'gcp', text: 'Google Cloud Platform', isPin: this.menuAgent.gcp ? this.menuAgent.gcp : false },
      pm: { id: 'pm', text: 'Policy Monitoring', isPin: this.menuAgent.pm ? this.menuAgent.pm : false },
      sca: { id: 'sca', text: 'Security configuration assessment', isPin: true, default: true },
      audit: { id: 'audit', text: 'System Auditing', isPin: this.menuAgent.audit ? this.menuAgent.audit : false },
      oscap: { id: 'oscap', text: 'OpenSCAP', isPin: this.menuAgent.oscap ? this.menuAgent.oscap : false },
      ciscat: { id: 'ciscat', text: 'CIS-CAT', isPin: this.menuAgent.oscap ? this.menuAgent.oscap : false },
      vuls: { id: 'vuls', text: 'Vulnerabilities', isPin: this.menuAgent.vuls ? this.menuAgent.vuls : false },
      virustotal: { id: 'virustotal', text: 'VirusTotal', isPin: this.menuAgent.virustotal ? this.menuAgent.virustotal : false },
      osquery: { id: 'osquery', text: 'Osquery', isPin: this.menuAgent.osquery ? this.menuAgent.osquery : false },
      docker: { id: 'docker', text: 'Docker Listener', isPin: this.menuAgent.docker ? this.menuAgent.docker : false },
      mitre: { id: 'mitre', text: 'MITRE ATT&CK', isPin: this.menuAgent.mitre ? this.menuAgent.mitre : false },
      pci: { id: 'pci', text: 'PCI DSS', isPin: this.menuAgent.pci ? this.menuAgent.pci : false },
      gdpr: { id: 'gdpr', text: 'GDPR', isPin: this.menuAgent.gdpr ? this.menuAgent.gdpr : false },
      hipaa: { id: 'hipaa', text: 'HIPAA', isPin: this.menuAgent.hipaa ? this.menuAgent.hipaa : false },
      nist: { id: 'nist', text: 'NIST 800-53', isPin: this.menuAgent.nist ? this.menuAgent.nist : false },
      tsc: { id: 'tsc', text: 'TSC', isPin: this.menuAgent.tsc ? this.menuAgent.tsc : false }
    };

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
  }

  updateFavs() {
    this.agentSections.general.isPin = !this.agentSections.general.isPin;
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
      // do not redirect if we already are in that tab
      window.location.href = `#/overview/?tab=${section}`;
      // #/agents?agent=${this.props.isAgent.id}&tab=${section}`
      this.router.reload();
      // if (!this.props.isAgent) {
      //   window.location.href = `#/overview/?tab=${section}`;
      //   store.dispatch(updateCurrentTab(section));
      // } else {
      //   if (!this.props.switchTab) {
      //     window.location.href = `#/overview/?tab=${section}`;
      //     // #/agents?agent=${this.props.isAgent.id}&tab=${section}`
      //     this.router.reload();
      //   } else {
      //     this.props.switchTab(section);
      //   }
      // }
    }
  };

  addToast({color, title, text, time = 3000}){
    toastNotifications.add({title, text, toastLifeTimeMs: time, color})
  }

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
            <EuiFlexItem grow={false}>
              <EuiIcon
              onClick={() => {
                this.menuAgent = window.localStorage.getItem('menuAgent') ? JSON.parse(window.localStorage.getItem('menuAgent')) : {};
                if(!item.isPin && Object.keys(this.menuAgent).length < 3) {
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
              type={this.menuAgent[item.id] || item.default ? 'pinFilled' : 'pin'}
              aria-label="Next"
              style={{ cursor: 'pointer' }}
              />
            </EuiFlexItem>
        }
      </EuiFlexGroup> ,
      isSelected: currentTab === item.id
    };
  };

  render() {
    this.updateFavs();
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
      if (!(UnsupportedComponents[this.props.isAgent.agentPlatform] || UnsupportedComponents['other']).includes('vuls')) {
        threatDetectionItems.unshift(this.agentSections.vuls);
      }
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
)(WzMenuAgent);
