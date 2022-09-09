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
import { EuiFlexGrid, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSideNav } from '@elastic/eui';
import { connect } from 'react-redux';
import { AppState } from '../../../../react-services/app-state';
import { hasAgentSupportModule } from '../../../../react-services/wz-agents';
import { getAngularModule, getToasts } from '../../../../kibana-services';
import { updateCurrentAgentData } from '../../../../redux/actions/appStateActions';
import { getAgentSections } from './agent-sections';

class WzMenuAgent extends Component {
  constructor(props) {
    super(props);
    this.currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    this.state = {
      extensions: [],
      hoverAddFilter: '',
    };

    this.menuAgent = window.localStorage.getItem('menuAgent')
      ? JSON.parse(window.localStorage.getItem('menuAgent'))
      : {};

    this.agentSections = getAgentSections(this.menuAgent)

    this.securityInformationItems = [
      this.agentSections.general,
      this.agentSections.fim,
      this.agentSections.aws,
      this.agentSections.gcp,
      this.agentSections.github
    ];
    this.auditingItems = [
      this.agentSections.pm,
      this.agentSections.audit,
      this.agentSections.oscap,
      this.agentSections.ciscat,
      this.agentSections.sca,
    ];
    this.threatDetectionItems = [
      this.agentSections.vuls,
      this.agentSections.docker,
      this.agentSections.virustotal,
      this.agentSections.osquery,
      this.agentSections.mitre,
    ];
    this.regulatoryComplianceItems = [
      this.agentSections.pci,
      this.agentSections.gdpr,
      this.agentSections.hipaa,
      this.agentSections.nist,
      this.agentSections.tsc,
    ];
  }

  async componentDidMount() {
    const extensions = await AppState.getExtensions(this.currentApi);
    this.setState({ extensions });
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }

  clickMenuItem = (section) => {
    this.props.closePopover();
    if (this.props.currentTab !== section) {
      // do not redirect if we already are in that tab
      window.location.href = `#/overview/?tab=${section}`;
      this.props.updateCurrentAgentData(this.props.isAgent);
      this.router.reload();
    }
  };

  addToast({ color, title, text, time = 3000 }) {
    getToasts().add({ title, text, toastLifeTimeMs: time, color });
  }

  createItems = (items) => {
    const keyExists = (key) => Object.keys(this.state.extensions).includes(key);
    const keyIsTrue = (key) => (this.state.extensions || [])[key];
    return items
      .filter(
        (item) =>
          hasAgentSupportModule(this.props.currentAgentData, item.id) &&
          Object.keys(this.state.extensions).length &&
          (!keyExists(item.id) || keyIsTrue(item.id))
      )
      .map((item) => this.createItem(item));
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: (
        <EuiFlexGroup
          onMouseEnter={() => {
            this.setState({ hoverAddFilter: item.id });
          }}
          onMouseLeave={() => {
            this.setState({ hoverAddFilter: '' });
          }}
        >
          <EuiFlexItem
            onClick={() => (!item.isTitle ? this.clickMenuItem(item.id) : null)}
            style={{ cursor: !item.isTitle ? 'pointer' : 'normal' }}
          >
            {item.text}
          </EuiFlexItem>
          {this.state.hoverAddFilter === item.id &&
            !item.isTitle &&
            (Object.keys(this.menuAgent).length < 6 || item.isPin) &&
            (Object.keys(this.menuAgent).length > 1 || !item.isPin) && (
              <EuiFlexItem grow={false}>
                <EuiIcon
                  onClick={() => {
                    this.menuAgent = window.localStorage.getItem('menuAgent')
                      ? JSON.parse(window.localStorage.getItem('menuAgent'))
                      : {};
                    if (!item.isPin && Object.keys(this.menuAgent).length < 6) {
                      this.menuAgent[item.id] = item;
                      item.isPin = true;
                    } else if (this.menuAgent[item.id]) {
                      delete this.menuAgent[item.id];
                      item.isPin = false;
                    } else {
                      this.addToast({
                        title: 'The limit of pinned modules has been reached',
                        color: 'danger',
                      });
                    }
                    window.localStorage.setItem('menuAgent', JSON.stringify(this.menuAgent));
                    this.props.updateMenuAgents();
                  }}
                  color="primary"
                  type={this.menuAgent[item.id] ? 'pinFilled' : 'pin'}
                  aria-label="Next"
                  style={{ cursor: 'pointer' }}
                />
              </EuiFlexItem>
            )}
        </EuiFlexGroup>
      ),
      isSelected: this.props.currentTab === item.id,
    };
  };

  render() {
    const securityInformation = [
      this.createItem(this.agentSections.securityInformation, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.securityInformationItems),
      }),
    ];

    const auditing = [
      this.createItem(this.agentSections.auditing, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: this.createItems(this.auditingItems),
      }),
    ];

    const threatDetection = [
      this.createItem(this.agentSections.threatDetection, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.threatDetectionItems),
      }),
    ];

    const regulatoryCompliance = [
      this.createItem(this.agentSections.regulatoryCompliance, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: this.createItems(this.regulatoryComplianceItems),
      }),
    ];

    return (
      <div className="WzManagementSideMenu">
        {(Object.keys(this.state.extensions).length && (
          <div>
            <EuiFlexGrid columns={2}>
              <EuiFlexItem>
                <EuiSideNav items={securityInformation} style={{ padding: '4px 12px' }} />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSideNav items={auditing} style={{ padding: '4px 12px' }} />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSideNav items={threatDetection} style={{ padding: '4px 12px' }} />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSideNav items={regulatoryCompliance} style={{ padding: '4px 12px' }} />
              </EuiFlexItem>
            </EuiFlexGrid>
          </div>
        )) || <div style={{ width: 300 }}></div>}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAgentData: state.appStateReducers.currentAgentData,
    currentTab: state.appStateReducers.currentTab,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateCurrentAgentData: (agentData) => dispatch(updateCurrentAgentData(agentData)),
});

export default connect(mapStateToProps, mapDispatchToProps)(WzMenuAgent);
