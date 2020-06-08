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
  EuiLoadingChart
} from '@elastic/eui';
import { FimEventsTable, ScaScan } from './components';
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
                        closePopover={() => this.setState({ switchModule: false })}
                        switchTab={(module) => this.props.switchTab(module)}></Overview>
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
                  <AgentInfo agent={this.props.agent} hideActions={true} {...this.props}></AgentInfo>
                </EuiPanel>
              </div>
            </div>
          </div>
        </div>
        <div className="wz-module-body">
{/*           <EuiPage>
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
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem>
                    <EuiPanel paddingSize="m" style={{ height: 86 }}>
                      <EuiText size="xs"><h2>Groups it belongs to</h2></EuiText>
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

                      <EuiFlexItem key={'Wazuh-App-Agents-Welcome-Most-Common-Groups'} style={{ height: 300 }}>
                        <EuiPanel paddingSize="none">
                          <EuiFlexItem>
                            <EuiFlexGroup
                              style={{ padding: '12px 12px 0px' }}
                              className="embPanel__header"
                            >
                              <h2 className="embPanel__title wz-headline-title">
                                <EuiText size="xs"><h2>MITRE top tactics</h2></EuiText>
                              </h2>
                            </EuiFlexGroup>
                            <EuiSpacer size="s" />
                            <div style={{ height: this.props.resultState === 'loading' ? 0 : 280 }}>
                              <WzReduxProvider>
                                <KibanaVis
                                  visID={'Wazuh-App-Agents-Welcome-Top-Tactics-Mitre'}
                                  tab={'welcome'}
                                ></KibanaVis>
                              </WzReduxProvider>
                            </div>
                            <div style={{ display: this.props.resultState === 'loading' ? 'block' : 'none', textAlign: "center", paddingTop: 100 }}>
                              <EuiLoadingChart size="xl" />
                            </div>
                          </EuiFlexItem>
                        </EuiPanel>
                      </EuiFlexItem>


                      <EuiFlexItem key={'Wazuh-App-Agents-Welcome-Top-PCI'} style={{ height: 300 }}>
                        <EuiPanel paddingSize="none">
                          <EuiFlexItem>
                            <EuiFlexGroup
                              style={{ padding: '12px 12px 0px' }}
                              className="embPanel__header"
                            >
                              <h2 className="embPanel__title wz-headline-title">
                                <EuiText size="xs"><h2>Compliance</h2></EuiText>
                              </h2>
                              <div style={{ width: "auto", paddingTop: 6, paddingRight: 12 }}>
                                <EuiSelect
                                  compressed={true}
                                  id="requirementSelect"
                                  options={this.getOptions()}
                                  value={this.state.selectedRequirement}
                                  onChange={e => this.setSelectValue(e)}
                                  aria-label="Select requirement"
                                />

                              </div>
                            </EuiFlexGroup>
                            <EuiSpacer size="s" />

                            <div style={{ height: this.props.resultState === 'loading' ? 0 : 280 }}>
                              <div style={{ height: this.state.selectedRequirement === 'pci' ? 280 : 0 }}>
                                <WzReduxProvider>
                                  <KibanaVis
                                    visID={'Wazuh-App-Agents-Welcome-Top-PCI'}
                                    tab={'welcome'}
                                  ></KibanaVis>
                                </WzReduxProvider>
                              </div>
                              <div style={{ height: this.state.selectedRequirement === 'gdpr' ? 280 : 0 }}>
                                <WzReduxProvider>
                                  <KibanaVis
                                    visID={'Wazuh-App-Agents-Welcome-Top-GDPR'}
                                    tab={'welcome'}
                                  ></KibanaVis>
                                </WzReduxProvider>
                              </div>
                              <div style={{ height: this.state.selectedRequirement === 'nist' ? 280 : 0 }}>
                                <WzReduxProvider>
                                  <KibanaVis
                                    visID={'Wazuh-App-Agents-Welcome-Top-NIST-800-53'}
                                    tab={'welcome'}
                                  ></KibanaVis>
                                </WzReduxProvider>
                              </div>
                              <div style={{ height: this.state.selectedRequirement === 'tsc' ? 280 : 0 }}>
                                <WzReduxProvider>
                                  <KibanaVis
                                    visID={'Wazuh-App-Agents-Welcome-Top-TSC'}
                                    tab={'welcome'}
                                  ></KibanaVis>
                                </WzReduxProvider>
                              </div>
                              <div style={{ height: this.state.selectedRequirement === 'gpg13' ? 280 : 0 }}>
                                <WzReduxProvider>
                                  <KibanaVis
                                    visID={'Wazuh-App-Agents-Welcome-Top-GPG-13'}
                                    tab={'welcome'}
                                  ></KibanaVis>
                                </WzReduxProvider>
                              </div>
                              <div style={{ height: this.state.selectedRequirement === 'hipaa' ? 280 : 0 }}>
                                <WzReduxProvider>
                                  <KibanaVis
                                    visID={'Wazuh-App-Agents-Welcome-Top-HIPAA'}
                                    tab={'welcome'}
                                  ></KibanaVis>
                                </WzReduxProvider>
                              </div>
                            </div>
                            <div style={{ display: this.props.resultState === 'loading' ? 'block' : 'none', alignSelf: "center", paddingTop: 100 }}>
                              <EuiLoadingChart size="xl" />
                            </div>
                          </EuiFlexItem>
                        </EuiPanel>
                      </EuiFlexItem>


                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem key={'Wazuh-App-Agents-Welcome-Events-Evolution'} style={{ height: 300 }}>
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
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem style={{ maxHeight: 86 }}>
                    <EuiFlexGroup justifyContent='flexEnd'>
                      <EuiFlexItem grow={false}>
                        <WzDatePicker onTimeChange={() => { }} />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <FimEventsTable agentId={this.props.agent.id} />
                  <ScaScan agentId={this.props.agent.id} switchTab={this.props.switchTab}/>
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
