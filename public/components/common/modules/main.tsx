/*
 * Wazuh app - Integrity monitoring components
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiHealth,
  EuiTitle,
  EuiToolTip,
  EuiButton,
  EuiTab,
  EuiTabs,
  EuiIcon,
  EuiPopover,
  EuiButtonIcon
} from '@elastic/eui';
import '../../common/modules/module.less';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';
import chrome from 'ui/chrome';
import { ReportingService } from '../../../react-services/reporting';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { ModulesDefaults } from './modules-defaults';
import { Events, Dashboard, Loader, Settings } from '../../common/modules';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { AgentInfo } from '../../common/welcome/agents-info';
import Overview from '../../wz-menu/wz-menu-overview';
import { MainFim } from '../../agents/fim';
import { MainSca } from '../../agents/sca';

export class MainModule extends Component {
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();
    this.state = {
      selectView: false,
      loadingReport: false,
      switchModule: false,
      showAgentInfo: false
    };
  }

  setGlobalBreadcrumb() {
    const breadcrumb = [
      {
        text: '',
      },
      {
        text: 'Agents',
        href: "#/agents-preview"
      },
      {
        text: `${this.props.agent.name} (${this.props.agent.id})`,
        onClick: () => {
          window.location.href = `#/agents?agent=${this.props.agent.id}`;
          this.router.reload();
        },
        className: 'wz-global-breadcrumb-btn',
        truncate: false,
      },
      {
        text: TabDescription[this.props.section].title,
      },
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    this.setGlobalBreadcrumb();
    if (!(ModulesDefaults[this.props.section] || {}).notModule) {
      this.tabs = (ModulesDefaults[this.props.section] || {}).tabs || [{ id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }];
      this.buttons = (ModulesDefaults[this.props.section] || {}).buttons || ['reporting', 'settings'];
      this.loadSection((ModulesDefaults[this.props.section] || {}).init || 'dashboard');
    }
  }

  componentWillUnmount() {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.removeAll();
    }
  }

  color = (status, hex = false) => {
    if (status.toLowerCase() === 'active') { return hex ? '#017D73' : 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return hex ? '#BD271E' : 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return hex ? '#98A2B3' : 'subdued'; }
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-agent-title" grow={false}>
          <EuiPopover
            button={
              <div className="wz-module-header-agent-title-btn"
                onClick={() => this.setState({ switchModule: !this.state.switchModule })}>
                <EuiTitle size="s">
                  <h1>
                    <span><b>{TabDescription[this.props.section].title}</b>&nbsp;&nbsp;</span>
                    <EuiIcon size="m" type="arrowDown" color='subdued' />
                  </h1>
                </EuiTitle>
              </div>
            }
            isOpen={this.state.switchModule}
            closePopover={() => this.setState({ switchModule: false })}
            repositionOnScroll={true}
            anchorPosition="downLeft">
            <WzReduxProvider>
              <div style={{ maxWidth: 650 }}>
                <Overview isAgent={this.props.agent} closePopover={() => this.setState({ switchModule: false })}></Overview>
              </div>
            </WzReduxProvider>
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem />
        <EuiFlexItem className="wz-module-header-agent-title" grow={false}>
          <EuiTitle size="s">
            <h1>
              <EuiToolTip position="right" content={this.props.agent.status}>
                <EuiHealth color={this.color(this.props.agent.status)}></EuiHealth>
              </EuiToolTip>
              <span>
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    window.location.href = `#/agents?agent=${this.props.agent.id}`;
                    this.router.reload();
                  }}>{this.props.agent.name} ({this.props.agent.id})&nbsp;&nbsp;
              </span>
                <EuiPopover
                  button={
                    <EuiButtonIcon style={{ marginTop: -6 }} iconSize="l" iconType="iInCircle" color='primary'
                      onClick={() => this.setState({ showAgentInfo: !this.state.showAgentInfo })}></EuiButtonIcon>
                  }
                  isOpen={this.state.showAgentInfo}
                  closePopover={() => this.setState({ showAgentInfo: false })}
                  repositionOnScroll={true}
                  anchorPosition="leftCenter">
                  <div style={{ width: '80vw' }}>
                    <AgentInfo agent={this.props.agent} hideActions={true} {...this.props}></AgentInfo>
                  </div>
                </EuiPopover>
              </span>
            </h1>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderTabs() {
    const { selectView } = this.state;
    return (
      <EuiFlexItem>
        <EuiTabs display="condensed">
          {this.tabs.map((tab, index) =>
            <EuiTab
              onClick={() => this.onSelectedTabChanged(tab.id)}
              isSelected={selectView === tab.id}
              key={index}
            >
              {tab.name}
            </EuiTab>
          )}
        </EuiTabs>
      </EuiFlexItem>
    );
  }

  async startReport() {
    this.setState({ loadingReport: true });
    await this.reportingService.startVis2Png(this.props.section, this.props.agent.id);
    this.setState({ loadingReport: false });
  }

  renderReportButton() {
    return (
      (this.props.disabledReport &&
        <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 4 }}>
          <EuiToolTip position="top" content="No results match for this search criteria.">
            <EuiButton
              iconType="document"
              isLoading={this.state.loadingReport}
              isDisabled={true}
              onClick={async () => this.startReport()}>
              Generate report
              </EuiButton>
          </EuiToolTip>
        </EuiFlexItem>

        || (
          <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 4 }}>
            <EuiButton
              iconType="document"
              isLoading={this.state.loadingReport}
              onClick={async () => this.startReport()}>
              Generate report
            </EuiButton>
          </EuiFlexItem>))
    );
  }

  renderDashboardButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 4 }}>
        <EuiButton
          fill={this.state.selectView === 'dashboard'}
          iconType="visLine"
          onClick={() => this.onSelectedTabChanged('dashboard')}>
          Dashboard
          </EuiButton>
      </EuiFlexItem>
    );
  }

  renderSettingsButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 4 }}>
        <EuiButton
          fill={this.state.selectView === 'settings'}
          iconType="wrench"
          onClick={() => this.onSelectedTabChanged('settings')}>
          Configuration
          </EuiButton>
      </EuiFlexItem>
    );
  }

  loadSection(id) {
    this.setState({ selectView: id });
  }

  onSelectedTabChanged(id) {
    if (id !== this.state.selectView) {
      if (id === 'events' || id === 'dashboard') {
        window.location.href = window.location.href.replace(
          new RegExp("tabView=" + "[^\&]*"),
          `tabView=${id === 'events' ? 'discover' : 'panels'}`);
        this.afterLoad = id;
        this.loadSection('loader');
      } else {
        this.loadSection(id);
      }
    }
  }

  render() {
    const { agent, section } = this.props;
    const { selectView } = this.state;
    const title = this.renderTitle();
    const mainProps = {
      selectView,
      onSelectedTabChanged: (id) => this.onSelectedTabChanged(id)
    }
    return (
      <div className='wz-module'>
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent' style={{ borderTop: `4px solid ${this.color(this.props.agent.status, true)}` }}>
            {title}
          </div>
        </div>
        {(agent && agent.os) &&
          <Fragment>
            {(this.tabs && this.tabs.length) &&
              <div className='wz-module-header-nav-wrapper'>
                <div className='wz-module-header-nav'>
                  <EuiFlexGroup>
                    {this.renderTabs()}
                    {(selectView === 'dashboard') &&
                      this.renderReportButton()
                    }
                    {(this.buttons || []).includes('dashboard') &&
                      this.renderDashboardButton()
                    }
                    {(this.buttons || []).includes('settings') &&
                      this.renderSettingsButton()
                    }
                  </EuiFlexGroup>
                </div>
              </div>
            }
            {!['syscollector', 'configuration'].includes(this.props.section) &&
              <div className='wz-module-body'>
                {selectView === 'events' &&
                  <Events {...this.props} />
                }
                {selectView === 'loader' &&
                  <Loader {...this.props}
                    loadSection={(section) => this.loadSection(section)}
                    redirect={this.afterLoad}>
                  </Loader>}
                {selectView === 'dashboard' &&
                  <Dashboard {...this.props} />
                }
                {selectView === 'settings' &&
                  <Settings {...this.props} />
                }

                {/* ---------------------MODULES WITH CUSTOM PANELS--------------------------- */}
                {section === 'fim' && <MainFim {...{ ...this.props, ...mainProps }} />}
                {section === 'sca' && <MainSca {...{ ...this.props, ...mainProps }} />}
                {/* -------------------------------------------------------------------------- */}
              </div>
            }
          </Fragment>
        }
        {(!agent || !agent.os) &&
          <EuiCallOut
            style={{ margin: '66px 16px 0 16px' }}
            title=" This agent has never connected"
            color="warning"
            iconType="alert">
          </EuiCallOut>
        }
      </div>
    );
  }
}
