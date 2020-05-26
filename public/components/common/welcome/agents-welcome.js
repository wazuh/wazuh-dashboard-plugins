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
import React, { Component, Fragment } from 'react';
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
  EuiButtonIcon,
  EuiEmptyPrompt
} from '@elastic/eui';
import { FimEventsTable, ScaScan, MitreTopTactics, RequirementVis } from './components';
import { AgentInfo } from './agents-info';
import { TabDescription } from '../../../../server/reporting/tab-description';
import store from '../../../redux/store';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import { ActionAgents } from '../../../react-services/action-agents';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import MenuAgent from './components/menu-agent';
import './welcome.less';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import chrome from 'ui/chrome';
import { updateCurrentAgentData } from '../../../redux/actions/appStateActions';

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
      selectedRequirement: 'pci',
      menuAgent: {}
    };

    this.fav = true;

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
    this.updateMenuAgents();
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
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
  }

  updateMenuAgents() {
    this.setState({ menuAgent: window.localStorage.getItem('menuAgent') ? JSON.parse(window.localStorage.getItem('menuAgent')) : {} });
  }

  renderTitle() {
    const menuAgent = [...Object.keys(this.state.menuAgent).map((item) => { return this.state.menuAgent[item] })];

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
              <EuiButtonEmpty
                onClick={() => {
                  window.location.href = `#/overview/?tab=general`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }} style={{ cursor: 'pointer' }}>
                <span>Security events&nbsp;</span>
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 7 }}>
              <EuiButtonEmpty
                onClick={() => {
                  window.location.href = `#/overview/?tab=fim`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }} style={{ cursor: 'pointer' }}>
                <span>Integrity monitoring&nbsp;</span>
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 7 }}>
              <EuiButtonEmpty
                onClick={() => {
                  window.location.href = `#/overview/?tab=sca`;
                  store.dispatch(updateCurrentAgentData(this.props.agent));
                  this.router.reload();
                }} style={{ cursor: 'pointer' }}>
                <span>SCA&nbsp;</span>
              </EuiButtonEmpty>
            </EuiFlexItem>
            {
              menuAgent.map((menuAgent, i) => (
                <EuiFlexItem key={i} grow={false} style={{ marginLeft: 0, marginTop: 7 }}>
                  <EuiButtonEmpty
                    onClick={() => {
                      window.location.href = `#/overview/?tab=${menuAgent.id}`;
                      store.dispatch(updateCurrentAgentData(this.props.agent));
                      this.router.reload();
                    }} style={{ cursor: 'pointer' }}>
                    <span>{menuAgent.text}&nbsp;</span>
                  </EuiButtonEmpty>
                </EuiFlexItem>
              ))}
            <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
              <EuiPopover
                button={
                  <EuiButtonEmpty
                    iconSide="right"
                    iconType="arrowDown"
                    onClick={() => this.setState({ switchModule: !this.state.switchModule })}>
                    More...
                  </EuiButtonEmpty>
                }
                isOpen={this.state.switchModule}
                closePopover={() => this.setState({ switchModule: false })}
                repositionOnScroll={false}
                anchorPosition="downLeft">
                <div>
                  <WzReduxProvider>
                    <div style={{ maxWidth: 700 }}>
                      <MenuAgent
                        isAgent={this.props.agent}
                        updateMenuAgents={() => this.updateMenuAgents()}
                        closePopover={() => {
                          this.setState({ switchModule: false })
                        }
                        }
                        switchTab={(module) => this.props.switchTab(module)}></MenuAgent>
                    </div>
                  </WzReduxProvider>
                </div>
              </EuiPopover>
            </EuiFlexItem>
            <EuiFlexItem></EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
              <EuiButtonEmpty
                iconType="inspect"
                onClick={() => this.props.switchTab('syscollector')}>
                Inventory data
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
              <EuiButtonEmpty
                iconType="gear"
                onClick={() => this.props.switchTab('configuration')}>
                Configuration
              </EuiButtonEmpty>
            </EuiFlexItem>
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
    if (this.props.agent.status === 'Never connected') {
      return (
        <EuiEmptyPrompt
          iconType="securitySignalDetected"
          style={{ marginTop: 20 }}
          title={<h2>Agent has never connected.</h2>}
          body={
            <Fragment>
              <p>
                The agent has been registered but has not yet connected to the manager.
            </p>
              <a href="https://documentation.wazuh.com/current/user-manual/agents/agent-connection.html" target="_blank">
                https://documentation.wazuh.com/current/user-manual/agents/agent-connection.html
            </a>
            </Fragment>
          }
          actions={
            <EuiButton href='#/agents-preview?' color="primary" fill>
              Back
          </EuiButton>
          }
        />)
    }

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
              <EuiFlexItem />
              <EuiFlexItem style={{ alignItems: 'flex-end' }}> {/* DatePicker */}
                <WzDatePicker onTimeChange={() => { }} />
              </EuiFlexItem>
              <EuiFlexItem> {/* Pie visualizations */}
                <EuiFlexGroup>

                  <EuiFlexItem key={'Wazuh-App-Agents-Welcome-MITRE-Top-Tactics'} >
                    <EuiPanel paddingSize="s" height={{ height: 300 }}>
                      <EuiFlexItem>
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <h2 className="embPanel__title wz-headline-title">
                              <EuiText size="xs"><h2>MITRE</h2></EuiText>
                            </h2>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ alignSelf: 'center' }}>
                            <EuiToolTip position="top" content="Open MITRE">
                              <EuiButtonIcon
                                iconType="popout"
                                color="primary"
                                onClick={() => {
                                  window.location.href = `#/overview?tab=mitre`;
                                  store.dispatch(updateCurrentAgentData(this.props.agent));
                                  this.router.reload();
                                }
                                }
                                aria-label="Open MITRE" />
                            </EuiToolTip>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
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
                  <ScaScan switchTab={this.props.switchTab} {...this.props} />
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGrid>
          </EuiPage>
        </div>
      </div>
    );
  }
}
