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
  EuiText,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiTitle,
  EuiHealth,
  EuiHorizontalRule,
  EuiPage,
  EuiButton,
  EuiPopover,
  EuiSelect,
  EuiLoadingChart,
  EuiToolTip,
  EuiButtonIcon
} from '@elastic/eui';
import { FimEventsTable, ScaScan, MitreTopTactics, RequirementVis } from './components';
import { AgentInfo } from './agents-info';
import { TabDescription } from '../../../../server/reporting/tab-description';
import store from '../../../redux/store';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import { ActionAgents } from '../../../react-services/action-agents';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import Overview from '../../wz-menu/wz-menu-overview';
import './welcome.less';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';

export class AgentsWelcome extends Component {
  _isMount = false;
  constructor(props) {
    super(props);

    this.state = {
      extensions: this.props.extensions,
      lastScans: [],
      isLoading: true,
      sortField: 'start_scan',
      sortDirection: 'desc',
      actionAgents: true, // Hide actions agents
      selectedRequirement: 'pci'
    };

  }

  setGlobalBreadcrumb() {
    const breadcrumb = [
      { text: '' },
      {
        text: 'Agents',
        href: "#/agents-preview"
      },
      {
        text: `${this.props.agent.name} (${this.props.agent.id})`,
        className: 'wz-global-breadcrumb-btn euiBreadcrumb--truncate',
        truncate: false,
      }
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }


  async componentDidMount() {
    this._isMount = true;
    this.setGlobalBreadcrumb();
    const tabVisualizations = new TabVisualizations();
    tabVisualizations.removeAll();
    tabVisualizations.setTab('welcome');
    tabVisualizations.assign({
      welcome: 8
    });
    const filterHandler = new FilterHandler(AppState.getCurrentPattern());
    await VisFactoryHandler.buildAgentsVisualizations(
      filterHandler,
      'welcome',
      null,
      this.props.agent.id
    );
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-agent-title">
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <span style={{ display: 'inline-flex' }}>
                <EuiTitle size="s">
                  <h1>
                    <span>{this.props.agent.name}</span>
                  </h1>
                </EuiTitle>
              </span>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 7 }}>
              <EuiPopover
                button={
                  <EuiButtonEmpty
                    onClick={() => this.setState({ switchModule: !this.state.switchModule })} style={{ cursor: 'pointer' }}
                    iconType="apps">
                    <span>Navigation&nbsp;<EuiIcon type='arrowDown'></EuiIcon></span>
                  </EuiButtonEmpty>
                }
                isOpen={this.state.switchModule}
                closePopover={() => this.setState({ switchModule: false })}
                repositionOnScroll={true}
                anchorPosition="downLeft">
                <div>
                  <WzReduxProvider>
                    <div style={{ maxWidth: 650 }}>
                      <Overview
                        isAgent={this.props.agent}
                        closePopover={() => this.setState({ switchModule: false })}></Overview>
                    </div>
                  </WzReduxProvider>
                  <EuiHorizontalRule margin="s" />
                  <EuiSpacer size='m' />
                  <EuiFlexGroup>
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
                  </EuiFlexGroup>
                </div>
              </EuiPopover>
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

  onTimeChange = (datePicker) => {
    const { start: from, end: to } = datePicker;
    this.setState({ datePicker: { from, to } });
  }

  getOptions() {
    return [
      { value: 'pci', text: 'PCI DSS' },
      { value: 'gdpr', text: 'GDPR' },
      { value: 'nist', text: 'NIST 800-53' },
      { value: 'hipaa', text: 'HIPAA' },
      { value: 'gpg13', text: 'GPG13' },
      { value: 'tsc', text: 'TSC' },
    ];
  }

  setSelectValue(e) {
    this.setState({ selectedRequirement: e.target.value });
  }

  getRequirementVis() {
    if (this.state.selectedRequirement === 'pci') {
      return 'Wazuh-App-Agents-Welcome-Top-PCI';
    }
    if (this.state.selectedRequirement === 'gdpr') {
      return 'Wazuh-App-Agents-Welcome-Top-GDPR';
    }
    if (this.state.selectedRequirement === 'hipaa') {
      return 'Wazuh-App-Agents-Welcome-Top-HIPAA';
    }
    if (this.state.selectedRequirement === 'nist') {
      return 'Wazuh-App-Agents-Welcome-Top-NIST-800-53';
    }
    if (this.state.selectedRequirement === 'gpg13') {
      return 'Wazuh-App-Agents-Welcome-Top-GPG-13';
    }
    if (this.state.selectedRequirement === 'tsc') {
      return 'Wazuh-App-Agents-Welcome-Top-TSC';
    }
    return 'Wazuh-App-Agents-Welcome-Top-PCI'
  }

  render() {
    const title = this.renderTitle();
    const upgradeButton = this.renderUpgradeButton();

    return (
      <div className="wz-module wz-module-welcome">
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent wz-module-header-agent-main'>
            {title}
          </div>
        </div>
        <div>
          <div className='wz-module-header-nav-wrapper'>
            <div className='wz-module-header-nav'>
              <div style={{ margin: '0 16px' }}>
                <EuiPanel paddingSize='s' className="wz-welcome-page-agent-info">
                  <AgentInfo agent={this.props.agent} isCondensed={false} hideActions={true} {...this.props}></AgentInfo>
                </EuiPanel>
              </div>
            </div>
          </div>
        </div>
        <div className="wz-module-body">
          {/* <EuiPage>
            <EuiFlexGroup className="wz-welcome-page-agent-info-actions">
              {this.state.hideActions === false &&
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
              }
            </EuiFlexGroup>
          </EuiPage> */}
          <EuiPage>
            <EuiFlexGrid columns={2}>
              <EuiFlexItem> {/* Groups */}
                <EuiPanel paddingSize="m" style={{ padding: '6px 8px 0 8px' }}>
                  <span style={{ display: 'inline-flex', height: 0 }}>
                    <EuiText size="xs" style={{ height: 0 }}>
                      <h2 style={{ fontSize: '16px!important', fontWeight: 400 }}>Groups</h2>
                    </EuiText>
                    <div>
                      {this.props.agent.group.map((group, key) => (
                        <EuiButtonEmpty
                          style={{ marginLeft: 8, marginTop: -6 }}
                          key={`agent-group-${key}`}
                          onClick={() => this.props.goGroups(this.props.agent, key)}
                        >
                          {group}
                        </EuiButtonEmpty>
                      ))}
                    </div>
                  </span>
                </EuiPanel>
              </EuiFlexItem>
              <EuiFlexItem style={{ alignItems: 'flex-end' }}> {/* DatePicker */}
                <WzDatePicker onTimeChange={() => { }} />
              </EuiFlexItem>
              <EuiFlexItem> {/* Pie visualizations */}
                <EuiFlexGroup>

                  <EuiFlexItem key={'Wazuh-App-Agents-Welcome-MITRE-Top-Tactics'} >
                    <EuiPanel paddingSize="m" height={{height: 300}}>
                        <EuiFlexGroup>
                          <h2 className="embPanel__title wz-headline-title">
                            <EuiText size="xs"><h2>MITRE</h2></EuiText>
                          </h2>
                          <EuiFlexItem grow={false}>
                            <EuiToolTip position="top" content="Open MITRE">
                              <EuiButtonIcon 
                                iconType="popout"
                                color="primary"
                                onClick={() => this.props.switchTab('mitre')}
                                aria-label="Open MITRE"/>
                            </EuiToolTip>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiSpacer size="m" />
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <MitreTopTactics agentId={this.props.agent.id} />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiPanel>
                  </EuiFlexItem>

                  <RequirementVis
                    agent={this.props.agent}
                    width={200}
                    height={200}
                    innerRadius={70}
                    outerRadius={100} />

                </EuiFlexGroup>
              </EuiFlexItem>
              <FimEventsTable agentId={this.props.agent.id} />
              <EuiFlexItem key={'Wazuh-App-Agents-Welcome-Events-Evolution'} > {/* Events count evolution */}
                <EuiPanel paddingSize="none">
                  <EuiFlexItem>
                    <EuiFlexGroup
                      style={{ padding: '12px 12px 0px' }}
                      className="embPanel__header"
                    >
                      <h2 className="embPanel__title wz-headline-title">
                        <EuiText size="xs"><h2>Events count evolution</h2></EuiText>
                      </h2>
                    </EuiFlexGroup>
                    <EuiSpacer size="s" />
                    <div style={{ height: this.props.resultState !== 'loading' ? '280px' : 0 }}>
                      <WzReduxProvider>
                        <KibanaVis
                          visID={'Wazuh-App-Agents-Welcome-Events-Evolution'}
                          tab={'welcome'}
                        ></KibanaVis>
                      </WzReduxProvider>
                    </div>
                    <div style={{ display: this.props.resultState === 'loading' ? 'block' : 'none', alignSelf: "center", paddingTop: 100 }}>
                      <EuiLoadingChart size="xl" />
                    </div>
                  </EuiFlexItem>
                </EuiPanel>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup direction="column">
                  <ScaScan agentId={this.props.agent.id} switchTab={this.props.switchTab} />
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGrid>
          </EuiPage>
        </div>
      </div>
    );
  }
}
