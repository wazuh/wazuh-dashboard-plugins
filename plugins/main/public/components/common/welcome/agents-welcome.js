/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
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
import {
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiPage,
  EuiPopover,
  EuiToolTip,
  EuiButtonIcon,
  EuiPageBody,
  EuiLink,
} from '@elastic/eui';
import {
  FimEventsTable,
  ScaScan,
  MitreTopTactics,
  RequirementVis,
} from './components';
import { AgentInfo } from './agents-info';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import MenuAgent from './components/menu-agent';
import './welcome.scss';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import { getChrome, getCore } from '../../../kibana-services';
import { hasAgentSupportModule } from '../../../react-services/wz-agents';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withGuard,
  withReduxProvider,
} from '../hocs';
import { compose } from 'redux';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import {
  PromptAgentNeverConnected,
  PromptNoSelectedAgent,
} from '../../agents/prompts';
import { WzButton } from '../buttons';
import {
  Applications,
  configurationAssessment,
  fileIntegrityMonitoring,
  endpointSummary,
  mitreAttack,
  threatHunting,
  malwareDetection,
} from '../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { EventsCount } from './dashboard/events-count';
import { ButtonExploreAgent } from '../../wz-agent-selector/button-explore-agent';

export const AgentsWelcome = compose(
  withReduxProvider,
  withErrorBoundary,
  withGlobalBreadcrumb(({ agent }) => {
    return [
      {
        text: endpointSummary.breadcrumbLabel,
        href: getCore().application.getUrlForApp(endpointSummary.id, {
          path: `#/agents-preview`,
        }),
      },
      ...(agent?.name
        ? [
            {
              text: `${agent.name}`,
              truncate: true,
            },
          ]
        : []),
    ];
  }),
  withGuard(
    props => !(props.agent && props.agent.id),
    () => (
      <>
        <PromptNoSelectedAgent
          body={
            <>
              You need to select an agent or return to
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  aria-label='go to Endpoint summary'
                  href={`${endpointSummary.id}#/agents-preview`}
                >
                  Endpoint summary
                </EuiLink>
              </RedirectAppLinks>
            </>
          }
        />
      </>
    ),
  ),
  withGuard(
    props => props.agent.status === API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    PromptAgentNeverConnected,
  ),
)(
  class AgentsWelcome extends Component {
    _isMount = false;
    sidebarSizeDefault;
    constructor(props) {
      super(props);

      this.offset = 275;

      this.sidebarSizeDefault = 320;

      this.state = {
        lastScans: [],
        isLoading: true,
        sortField: 'start_scan',
        sortDirection: 'desc',
        actionAgents: true, // Hide actions agents
        selectedRequirement: 'pci',
        menuAgent: [],
        maxModules: 5,
        widthWindow: window.innerWidth,
        isLocked: false,
      };
    }

    updateWidth = () => {
      let menuSize;
      if (this.state.isLocked) {
        menuSize = window.innerWidth - this.offset - this.sidebarSizeDefault;
      } else {
        menuSize = window.innerWidth - this.offset;
      }
      let maxModules = 5;
      if (menuSize > 1400) {
        maxModules = 5;
      } else {
        if (menuSize > 1250) {
          maxModules = 4;
        } else {
          if (menuSize > 1100) {
            maxModules = 3;
          } else {
            if (menuSize > 900) {
              maxModules = 2;
            } else {
              maxModules = 1;
              if (menuSize < 750) {
                maxModules = null;
              }
            }
          }
        }
      }

      this.setState({ maxModules: maxModules, widthWindow: window.innerWidth });
    };

    async componentDidMount() {
      this._isMount = true;
      this.updatePinnedApplications();
      this.updateWidth();
      const tabVisualizations = new TabVisualizations();
      tabVisualizations.removeAll();
      tabVisualizations.setTab('welcome');
      tabVisualizations.assign({
        welcome: 8,
      });

      this.drawerLokedSubscribtion = getChrome()
        .getIsNavDrawerLocked$()
        .subscribe(isLocked => {
          this.setState({ isLocked }, () => {
            this.updateWidth();
          });
        });
      window.addEventListener('resize', this.updateWidth); //eslint-disable-line
    }

    componentWillUnmount() {
      this.drawerLokedSubscribtion?.unsubscribe();
    }

    updatePinnedApplications(applications) {
      let pinnedApplications;

      if (applications) {
        pinnedApplications = applications;
      } else {
        pinnedApplications = window.localStorage.getItem(
          'wz-menu-agent-apps-pinned',
        )
          ? JSON.parse(window.localStorage.getItem('wz-menu-agent-apps-pinned'))
          : [
              // Default pinned applications
              threatHunting.id,
              fileIntegrityMonitoring.id,
              configurationAssessment.id,
              mitreAttack.id,
              malwareDetection.id,
            ];
      }

      // Ensure the pinned applications are supported
      pinnedApplications = pinnedApplications.filter(pinnedApplication =>
        Applications.some(({ id }) => id === pinnedApplication),
      );

      window.localStorage.setItem(
        'wz-menu-agent-apps-pinned',
        JSON.stringify(pinnedApplications),
      );
      this.setState({ menuAgent: pinnedApplications });
    }

    renderModules() {
      return (
        <Fragment>
          {this.state.menuAgent.map((applicationId, i) => {
            const moduleID = Object.keys(WAZUH_MODULES).find(
              key => WAZUH_MODULES[key]?.appId === applicationId,
            ).appId;
            if (
              i < this.state.maxModules &&
              hasAgentSupportModule(this.props.agent, moduleID)
            ) {
              return (
                <EuiFlexItem
                  key={i}
                  grow={false}
                  style={{ marginLeft: 0, marginTop: 7 }}
                >
                  <RedirectAppLinks application={getCore().application}>
                    <EuiButtonEmpty
                      href={getCore().application.getUrlForApp(applicationId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>
                        {
                          Applications.find(({ id }) => id === applicationId)
                            .title
                        }
                        &nbsp;
                      </span>
                    </EuiButtonEmpty>
                  </RedirectAppLinks>
                </EuiFlexItem>
              );
            }
          })}
          <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
            <EuiPopover
              button={
                <EuiButtonEmpty
                  iconSide='right'
                  iconType='arrowDown'
                  onClick={() =>
                    this.setState({ switchModule: !this.state.switchModule })
                  }
                >
                  More...
                </EuiButtonEmpty>
              }
              isOpen={this.state.switchModule}
              closePopover={() => this.setState({ switchModule: false })}
              repositionOnScroll={false}
              anchorPosition='downCenter'
            >
              <div>
                <WzReduxProvider>
                  <div style={{ maxWidth: 730 }}>
                    <MenuAgent
                      isAgent={this.props.agent}
                      pinnedApplications={this.state.menuAgent}
                      updatePinnedApplications={applications =>
                        this.updatePinnedApplications(applications)
                      }
                      closePopover={() => {
                        this.setState({ switchModule: false });
                      }}
                    ></MenuAgent>
                  </div>
                </WzReduxProvider>
              </div>
            </EuiPopover>
          </EuiFlexItem>
        </Fragment>
      );
    }

    renderTitle() {
      const thereAreAgentSelected = Boolean(this.props.agent?.id);
      // Calculate if the header buttons should display the name or only the icon to be responsive

      return (
        <EuiFlexGroup
          justifyContent='spaceBetween'
          responsive={false}
          gutterSize='xs'
        >
          <EuiFlexItem grow={false} className='wz-module-header-agent-title'>
            <EuiFlexGroup responsive={false} gutterSize='xs'>
              {(this.state.maxModules !== null && this.renderModules()) || (
                <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
                  <EuiPopover
                    button={
                      <EuiButtonEmpty
                        iconSide='right'
                        iconType='arrowDown'
                        onClick={() =>
                          this.setState({
                            switchModule: !this.state.switchModule,
                          })
                        }
                      >
                        Applications
                      </EuiButtonEmpty>
                    }
                    isOpen={this.state.switchModule}
                    closePopover={() => this.setState({ switchModule: false })}
                    repositionOnScroll={false}
                    anchorPosition='downCenter'
                  >
                    <div>
                      <WzReduxProvider>
                        <div style={{ maxWidth: 730 }}>
                          <MenuAgent
                            isAgent={this.props.agent}
                            pinnedApplications={this.state.menuAgent}
                            updatePinnedApplications={applications =>
                              this.updatePinnedApplications(applications)
                            }
                            closePopover={() => {
                              this.setState({ switchModule: false });
                            }}
                          ></MenuAgent>
                        </div>
                      </WzReduxProvider>
                    </div>
                  </EuiPopover>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false} className='wz-module-header-agent-title'>
            <EuiFlexGroup responsive={false} gutterSize='none'>
              <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
                <ButtonExploreAgent />
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
                <WzButton
                  buttonType='empty'
                  iconType='inspect'
                  onClick={() => this.props.switchTab('syscollector')}
                  className='wz-it-hygiene-header-button'
                  tooltip={
                    this.state.maxModules === null
                      ? { position: 'bottom', content: 'Inventory data' }
                      : undefined
                  }
                >
                  {this.state.maxModules !== null ? 'Inventory data' : ''}
                </WzButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
                <WzButton
                  buttonType='empty'
                  iconType='stats'
                  onClick={() => this.props.switchTab('stats')}
                  className='wz-it-hygiene-header-button'
                  tooltip={
                    this.state.maxModules === null
                      ? { position: 'bottom', content: 'Stats' }
                      : undefined
                  }
                >
                  {this.state.maxModules !== null ? 'Stats' : ''}
                </WzButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: 7 }}>
                <WzButton
                  buttonType='empty'
                  iconType='gear'
                  onClick={() => this.props.switchTab('configuration')}
                  className='wz-it-hygiene-header-button'
                  tooltip={
                    this.state.maxModules === null
                      ? { position: 'bottom', content: 'Configuration' }
                      : undefined
                  }
                >
                  {this.state.maxModules !== null ? 'Configuration' : ''}
                </WzButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    onTimeChange = datePicker => {
      const { start: from, end: to } = datePicker;
      this.setState({ datePicker: { from, to } });
    };

    renderMitrePanel() {
      return (
        <Fragment>
          <EuiPanel paddingSize='s' height={{ height: 300 }}>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <h2 className='embPanel__title wz-headline-title'>
                    <EuiText size='xs'>
                      <h2>MITRE ATT&CK</h2>
                    </EuiText>
                  </h2>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ alignSelf: 'center' }}>
                  <EuiToolTip position='top' content='Open MITRE ATT&CK'>
                    <RedirectAppLinks application={getCore().application}>
                      <EuiButtonIcon
                        iconType='popout'
                        color='primary'
                        href={`${getCore().application.getUrlForApp(
                          mitreAttack.id,
                        )}?agent=${this.props.agent.id}`}
                        aria-label='Open MITRE ATT&CK'
                      />
                    </RedirectAppLinks>
                  </EuiToolTip>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiSpacer size='m' />
            <EuiFlexGroup>
              <EuiFlexItem>
                <MitreTopTactics agentId={this.props.agent.id} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </Fragment>
      );
    }

    renderCompliancePanel() {
      return (
        <RequirementVis
          agent={this.props.agent}
          width={200}
          height={200}
          innerRadius={70}
          outerRadius={100}
        />
      );
    }

    renderEventCountVisualization() {
      return <EventsCount />;
    }

    renderSCALastScan() {
      return (
        <EuiFlexGroup direction='column'>
          <ScaScan {...this.props} />
        </EuiFlexGroup>
      );
    }

    render() {
      const title = this.renderTitle();

      return (
        <div className='wz-module wz-module-welcome'>
          <div className='wz-module-header-agent-wrapper'>
            <div className='wz-module-header-agent-main'>{title}</div>
          </div>
          <div className='wz-module-agents-padding-responsive'>
            <EuiPage>
              <EuiPageBody component='div'>
                <div className='wz-module-header-nav'>
                  <div>
                    <EuiPanel
                      grow
                      paddingSize='s'
                      className='wz-welcome-page-agent-info'
                    >
                      <AgentInfo
                        agent={this.props.agent}
                        isCondensed={false}
                        hideActions={true}
                        {...this.props}
                      ></AgentInfo>
                    </EuiPanel>
                  </div>
                </div>
                <EuiFlexGroup>
                  <EuiFlexItem />
                  <EuiFlexItem
                    style={{
                      alignItems: 'flex-end',
                      marginTop: 10,
                      marginBottom: 10,
                    }}
                  >
                    {' '}
                    {/* TODO: Replace with SearchBar and replace implementation to get the time range in AgentView component*/}
                    <WzDatePicker condensed={true} onTimeChange={() => {}} />
                  </EuiFlexItem>
                </EuiFlexGroup>
                {(this.state.widthWindow < 1150 && (
                  <Fragment>
                    <EuiFlexGrid columns={2}>
                      <EuiFlexItem
                        key={'Wazuh-App-Agents-Welcome-MITRE-Top-Tactics'}
                      >
                        {this.renderMitrePanel()}
                      </EuiFlexItem>
                      {this.renderCompliancePanel()}
                    </EuiFlexGrid>
                    <EuiSpacer size='m' />
                    <EuiFlexGroup>
                      <FimEventsTable agent={this.props.agent} />
                    </EuiFlexGroup>
                    <EuiSpacer size='m' />
                    <EuiFlexGroup>
                      <EuiFlexItem
                        key={'Wazuh-App-Agents-Welcome-Events-Evolution'}
                      >
                        {' '}
                        {/* Events count evolution */}
                        {this.renderEventCountVisualization()}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size='m' />
                    <EuiFlexGroup>
                      <EuiFlexItem>{this.renderSCALastScan()}</EuiFlexItem>
                    </EuiFlexGroup>
                  </Fragment>
                )) || (
                  <Fragment>
                    <EuiFlexGrid columns={2}>
                      <EuiFlexItem>
                        <EuiFlexGroup>
                          <EuiFlexItem
                            key={'Wazuh-App-Agents-Welcome-MITRE-Top-Tactics'}
                          >
                            {this.renderMitrePanel()}
                          </EuiFlexItem>
                          {this.renderCompliancePanel()}
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <FimEventsTable agent={this.props.agent} />
                    </EuiFlexGrid>
                    <EuiSpacer size='l' />
                    <EuiFlexGroup>
                      <EuiFlexItem
                        key={'Wazuh-App-Agents-Welcome-Events-Evolution'}
                      >
                        {' '}
                        {/* Events count evolution */}
                        {this.renderEventCountVisualization()}
                      </EuiFlexItem>
                      <EuiFlexItem>{this.renderSCALastScan()}</EuiFlexItem>
                    </EuiFlexGroup>
                  </Fragment>
                )}
              </EuiPageBody>
            </EuiPage>
          </div>
        </div>
      );
    }
  },
);
