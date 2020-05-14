/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
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
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiTitle,
  EuiHealth,
  EuiPage,
  EuiButton,
  EuiPopover,
  EuiBasicTable
} from '@elastic/eui';
import { AgentInfo } from './agents-info';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { UnsupportedComponents } from '../../../utils/components-os-support';
import { ActionAgents } from '../../../react-services/action-agents';
import { WzRequest } from '../../../react-services/wz-request';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import Overview from '../../wz-menu/wz-menu-overview';
import './welcome.less';

export class AgentsWelcome extends Component {
  _isMount = false;
  constructor(props) {
    super(props);

    this.state = {
      extensions: this.props.extensions,
      lastScans: [],
      isLoading: true,
      sortField: 'start_scan',
      sortDirection: 'asc',
    };
  }

  async componentDidMount() {
    this._isMount = true;
    this.getScans(this.props.agent.id);
  }

  async getScans(idAgent) {
    const scans = await WzRequest.apiReq('GET', `/sca/${idAgent}`, this.buildFilter());
    this._isMount &&
      this.setState({
        lastScans: (((scans.data || {}).data || {}).items || {}),
        isLoading: false,
      });
  }

  color = (status, hex = false) => {
    if (status.toLowerCase() === 'active') { return hex ? '#017D73' : 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return hex ? '#BD271E' : 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return hex ? '#98A2B3' : 'subdued'; }
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-agent-title">
          <EuiFlexGroup>
            <EuiFlexItem />
            <EuiFlexItem grow={false} className="wz-module-header-agent-title-badge">
              <span style={{ display: 'inline-flex', paddingLeft: 16 }}>
                <EuiTitle size="s">
                  <h1>
                    <span>{this.props.agent.name}&nbsp;&nbsp;&nbsp;</span>
                  </h1>
                </EuiTitle>
                <EuiHealth style={{ paddingTop: 3 }} size="xl" color={this.color(this.props.agent.status)}>
                  {this.props.agent.status}
                </EuiHealth>
              </span>
            </EuiFlexItem>
            <EuiFlexItem />
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  buildTabCard(tab, icon) {
    return (
      <EuiFlexItem>
        <EuiCard
          size="xs"
          layout="horizontal"
          icon={<EuiIcon size="xl" type={icon} color="primary" />}
          className="homSynopsis__card"
          title={TabDescription[tab].title}
          onClick={() => this.props.switchTab(tab)}
          description={TabDescription[tab].description}
        />
      </EuiFlexItem>
    );
  }
  onClickRestartAgent = () => {
    const { agent } = this.props;
    ActionAgents.restartAgent(agent.id);
  };

  onClickUpgradeAgent = () => {
    const { agent } = this.props;
    ActionAgents.upgradeAgent(agent.id);
  };

  renderUpgradeButton() {
    const { managerVersion } = this.state;
    const { agent } = this.props;
    let outDated = ActionAgents.compareVersions(managerVersion, agent.version);

    if (outDated === true) return;

    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          color="secondary"
          iconType="sortUp"
          onClick={this.onClickUpgradeAgent}
        >
          Upgrade
        </EuiButton>
      </EuiFlexItem>
    );
  }

  columns() {
    return [
      {
        field: 'start_scan',
        name: 'Time',
        sortable: true,
        width: '200px'
      },
      {
        field: 'name',
        name: 'Policy',
        sortable: true,
        truncateText: true,
      },
      {
        field: 'pass',
        name: 'Pass',
        sortable: true,
        width: '65px'
      },
      {
        field: 'fail',
        name: 'Fail',
        sortable: true,
        width: '65px'
      },
      {
        field: 'invalid',
        name: 'Not applicable',
        sortable: true,
        width: '100px'
      },
      {
        field: 'score',
        name: 'Score',
        sortable: true,
        width: '65px'
      },
    ];
  }

  onTableChange = ({ sort = {} }) => {
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      sortField,
      sortDirection,
    });
  };

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;

    const field = (sortField === 'start_scan') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction + field;
  }

  buildFilter() {
    const { filters } = this.props;

    const filter = {
      ...filters,
      limit: 5,
      sort: this.buildSortFilter(),
    };

    return filter;
  }

  renderScaTable() {
    const columns = this.columns();
    const {
      lastScans,
      isLoading,
      sortField,
      sortDirection,
    } = this.state;
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection
      }
    };

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={lastScans}
            columns={columns}
            loading={isLoading}
            sorting={sorting}
            onChange={this.onTableChange}
            itemId="policy_id"
            noItemsMessage="No scans found"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }

  render() {
    const title = this.renderTitle();
    const upgradeButton = this.renderUpgradeButton();
    const scaTable = this.renderScaTable();

    return (
      <div className="wz-module wz-module-welcome">
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent'>
            {title}
          </div>
        </div>
        <div>
          <div className='wz-module-header-nav-wrapper'>
            <div className='wz-module-header-nav'>
              <div className="wz-welcome-page-agent-info">
                <AgentInfo agent={this.props.agent} hideActions={true} {...this.props}></AgentInfo>
              </div>
            </div>
          </div>
        </div>
        <div className="wz-module-body">
          <EuiPage>
            <EuiFlexGroup className="wz-welcome-page-agent-info-actions">
              <EuiFlexItem grow={false} style={{ marginRight: 0, marginTop: 0 }}>
                <EuiPopover
                  button={
                    <EuiButton
                      onClick={() => this.setState({ switchModule: !this.state.switchModule })} style={{ cursor: 'pointer' }}
                      iconType="apps">
                      <span>Navigation&nbsp;<EuiIcon type='arrowDown'></EuiIcon></span>
                    </EuiButton>
                  }
                  isOpen={this.state.switchModule}
                  closePopover={() => this.setState({ switchModule: false })}
                  repositionOnScroll={true}
                  anchorPosition="downLeft">
                  <WzReduxProvider>
                    <div style={{ maxWidth: 650 }}>
                      <Overview
                        isAgent={this.props.agent}
                        closePopover={() => this.setState({ switchModule: false })}
                        switchTab={(module) => this.props.switchTab(module)}></Overview>
                    </div>
                  </WzReduxProvider>
                </EuiPopover>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginRight: 0, marginTop: 0 }}>
                <EuiButton
                  onClick={() => this.props.switchTab('syscollector')}
                  iconType="inspect">
                  <span>Inventory data</span>
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: 0 }}>
                <EuiButton
                  onClick={() => this.props.switchTab('configuration')}
                  iconType="gear" >
                  <span>Configuration</span>
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={true} style={{ marginTop: 0 }}>
                <EuiFlexGroup justifyContent="flexEnd">
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      color="primary"
                      iconType="refresh"
                      onClick={this.onClickRestartAgent}
                    >
                      Restart
                    </EuiButton>
                  </EuiFlexItem>
                  {upgradeButton}
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPage>
          <EuiPage style={{ paddingTop: 0 }}>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem>
                    <EuiPanel paddingSize="m" style={{ height: 86 }}>
                      <EuiTitle size="xs">
                        <h1>Groups it belongs to</h1>
                      </EuiTitle>
                      <div>
                        {this.props.agent.group.map((group, key) => (
                          <EuiButtonEmpty
                            style={{ marginLeft: -8 }}
                            key={`agent-group-${key}`}
                            onClick={() => this.props.goGroups(this.props.agent, key)}
                          >
                            {group}
                          </EuiButtonEmpty>
                        ))}
                      </div>
                    </EuiPanel>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiFlexGroup>
                      <EuiFlexItem style={{ marginTop: 0 }}>
                        <EuiPanel paddingSize="m" style={{ height: 'calc(50vh - 178px)' }}>
                          <EuiTitle size="xs">
                            <h1>Most common groups</h1>
                          </EuiTitle>
                        </EuiPanel>
                      </EuiFlexItem>
                      <EuiFlexItem style={{ marginTop: 0 }}>
                        <EuiPanel paddingSize="m">
                          <EuiTitle size="xs">
                            <h1>Top requirements</h1>
                          </EuiTitle>
                        </EuiPanel>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem style={{ marginTop: 0 }}>
                    <EuiPanel paddingSize="m" style={{ height: 'calc(50vh - 178px)' }}>
                      <EuiTitle size="xs">
                        <h1>Event count evolution</h1>
                      </EuiTitle>
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem>
                    <EuiPanel paddingSize="m">
                      <EuiTitle size="xs">
                        <h1>Last Integrity monitoring events</h1>
                      </EuiTitle>
                    </EuiPanel>
                  </EuiFlexItem>
                  <EuiFlexItem style={{ marginTop: 0 }}>
                    <EuiPanel paddingSize="m">
                      <EuiTitle size="xs">
                        <h1>Last SCA scans</h1>
                      </EuiTitle>
                      {scaTable}
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Security Information Management">
                      <EuiFlexGroup gutterSize="xs">
                        <EuiFlexItem />
                      </EuiFlexGroup>
                      <EuiSpacer size="s" />
                      <EuiFlexGrid columns={2}>
                        {this.buildTabCard('general', 'dashboardApp')}
                        {this.buildTabCard('fim', 'filebeatApp')}
                        {this.buildTabCard('gcp', 'logoGCPMono')}
                      </EuiFlexGrid>
                    </EuiPanel>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Auditing and Policy Monitoring">
                      <EuiSpacer size="s" />
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
                      <EuiSpacer size="s" />
                      {(
                        UnsupportedComponents[this.props.agent.agentPlatform] ||
                        UnsupportedComponents['other']
                      ).includes('vuls') &&
                        !this.props.extensions.virustotal &&
                        !this.props.extensions.osquery &&
                        !this.props.extensions.mitre &&
                        !this.props.extensions.docker && (
                          <EuiFlexGroup>
                            <EuiFlexItem>
                              <EuiCallOut
                                title={
                                  <p>
                                    Click the <EuiIcon type="eye" /> icon to
                                    show thread detection and response
                                    extensions.
                                  </p>
                                }
                                color="success"
                                iconType="help"
                              />
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        )}
                      <EuiFlexGrid columns={2}>
                        {!(
                          UnsupportedComponents[
                          this.props.agent.agentPlatform
                          ] || UnsupportedComponents['other']
                        ).includes('vuls') &&
                          this.buildTabCard('vuls', 'securityApp')}
                        {this.props.extensions.virustotal &&
                          this.buildTabCard('virustotal', 'savedObjectsApp')}
                        {this.props.extensions.osquery &&
                          this.buildTabCard('osquery', 'searchProfilerApp')}
                        {this.props.extensions.docker &&
                          this.buildTabCard('docker', 'logoDocker')}
                        {this.props.extensions.mitre &&
                          this.buildTabCard('mitre', 'spacesApp')}{' '}
                      </EuiFlexGrid>
                    </EuiPanel>
                  </EuiFlexItem>

                  <EuiFlexItem>
                    <EuiPanel betaBadgeLabel="Regulatory Compliance">
                      <EuiSpacer size="s" />
                      {!this.props.extensions.pci &&
                        !this.props.extensions.gdpr &&
                        !this.props.extensions.hipaa &&
                        !this.props.extensions.nist && (
                          <EuiFlexGroup>
                            <EuiFlexItem>
                              <EuiCallOut
                                title={
                                  <p>
                                    Click the <EuiIcon type="eye" /> icon to
                                    show regulatory compliance extensions.
                                  </p>
                                }
                                color="success"
                                iconType="help"
                              />
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        )}
                      {(this.props.extensions.pci ||
                        this.props.extensions.gdpr ||
                        this.props.extensions.hipaa ||
                        this.props.extensions.nist ||
                        this.props.extensions.tsc) && (
                          <EuiFlexGrid columns={2}>
                            {this.props.extensions.pci &&
                              this.buildTabCard('pci', 'visTagCloud')}
                            {this.props.extensions.nist &&
                              this.buildTabCard('nist', 'apmApp')}
                            {this.props.extensions.gdpr &&
                              this.buildTabCard('gdpr', 'visBarVertical')}
                            {this.props.extensions.hipaa &&
                              this.buildTabCard('hipaa', 'emsApp')}
                            {this.props.extensions.tsc &&
                              this.buildTabCard('tsc', 'apmApp')}
                          </EuiFlexGrid>
                        )}
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup> */}
          </EuiPage>
        </div>
      </div>
    );
  }
}
