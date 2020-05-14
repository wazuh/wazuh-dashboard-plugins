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
import ReactDOM from 'react-dom';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiHealth,
  EuiTitle,
  EuiToolTip,
  EuiTab,
  EuiTabs,
  EuiIcon,
  EuiPopover,
  EuiButtonEmpty
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
        className: 'wz-global-breadcrumb-btn euiBreadcrumb--truncate',
        truncate: false,
      },
      {
        text: '',
        className: 'wz-global-breadcrumb-popover'
      },
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    this.setGlobalBreadcrumb();
    if (!(ModulesDefaults[this.props.section] || {}).notModule) {
      this.tabs = (ModulesDefaults[this.props.section] || {}).tabs || [{ id: 'events', name: 'Events' }];
      this.buttons = (ModulesDefaults[this.props.section] || {}).buttons || ['dashboard', 'reporting', 'settings'];
      this.onSelectedTabChanged((ModulesDefaults[this.props.section] || {}).init || 'events');
    }
  }

  componentWillUnmount() {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.removeAll();
    }
  }


  showAgentInfo() {
    const elem = document.getElementsByClassName('wz-module-body-main')[0];
    if (elem) {
      if (!this.state.showAgentInfo) {
        elem.classList.add("wz-module-body-main-double");
      } else {
        elem.classList.remove("wz-module-body-main-double");
      }
    }
    this.setState({ showAgentInfo: !this.state.showAgentInfo });
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
                <EuiTitle size="s" className="wz-module-header-agent-title-btn">
                  <h1>
                    <span
                      onClick={() => {
                        window.location.href = `#/agents?agent=${this.props.agent.id}`;
                        this.router.reload();
                      }}>
                      <EuiIcon size="m" type="arrowLeft" color='primary' />
                      <span>&nbsp;{this.props.agent.name}&nbsp;&nbsp;&nbsp;
                      </span>
                    </span>
                  </h1>
                </EuiTitle>
                <EuiHealth style={{ paddingTop: 3 }} size="xl" color={this.color(this.props.agent.status)}>
                  {this.props.agent.status}
                </EuiHealth>
              </span>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{margin: '16px 0'}} className="wz-module-header-agent-title-btn">
              <EuiIcon type="iInCircle" color="primary" size="l" onClick={() => this.showAgentInfo()} />
            </EuiFlexItem>
            <EuiFlexItem />
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderTabs() {
    const { selectView } = this.state;
    return (
      <EuiFlexItem style={{ marginTop: 0 }}>
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
        <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
          <EuiToolTip position="top" content="No results match for this search criteria.">
            <EuiButtonEmpty
              iconType="document"
              isLoading={this.state.loadingReport}
              isDisabled={true}
              onClick={async () => this.startReport()}>
              Generate report
              </EuiButtonEmpty>
          </EuiToolTip>
        </EuiFlexItem>

        || (
          <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
            <EuiButtonEmpty
              iconType="document"
              isLoading={this.state.loadingReport}
              onClick={async () => this.startReport()}>
              Generate report
            </EuiButtonEmpty>
          </EuiFlexItem>))
    );
  }

  renderDashboardButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
        <EuiButtonEmpty
          fill={this.state.selectView === 'dashboard'}
          iconType="visLine"
          href="#/overview"
          target="blank">
          Dashboard
          </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  renderSettingsButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
        <EuiButtonEmpty
          fill={this.state.selectView === 'settings'}
          iconType="wrench"
          onClick={() => this.onSelectedTabChanged('settings')}>
          Configuration
          </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  loadSection(id) {
    this.setState({ selectView: id });
  }

  onSelectedTabChanged(id) {
    if (id !== this.state.selectView) {
      if (id === 'events') {
        window.location.href = window.location.href.replace(
          new RegExp("tabView=" + "[^\&]*"), 'tabView=discover');
        this.afterLoad = id;
        this.loadSection('loader');
      } else {
        this.loadSection(id);
      }
    }
  }

  createBreadcrumbPopover() {
    const container = document.getElementsByClassName('wz-global-breadcrumb-popover');
    if (container.length)
      return ReactDOM.createPortal(
        <Fragment>
          <EuiPopover
            button={
              <span onClick={() => this.setState({ switchModule: !this.state.switchModule })} style={{ cursor: 'pointer' }}>
                <span>{TabDescription[this.props.section].title}&nbsp;&nbsp;</span>
                <EuiIcon size="m" type="arrowDown" color='subdued' />
              </span>
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
        </Fragment>,
        container[0]
      );
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
      <div className={this.state.showAgentInfo ? 'wz-module wz-module-showing-agent' : 'wz-module'}>
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent'>
            {title}
          </div>
        </div>
        {(agent && agent.os) &&
          <Fragment>
            <div className='wz-module-header-nav-wrapper'>
              <div className={this.tabs && this.tabs.length && 'wz-module-header-nav'}>
                {this.state.showAgentInfo &&
                  <div className={
                    !this.tabs || !this.tabs.length ?
                      "wz-welcome-page-agent-info" :
                      "wz-welcome-page-agent-info wz-welcome-page-agent-info-gray"}>
                    <AgentInfo agent={this.props.agent} hideActions={true} {...this.props}></AgentInfo>
                  </div>
                }
                {(this.tabs && this.tabs.length) &&
                  <div className="wz-welcome-page-agent-tabs">
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
                }
              </div>
            </div>
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

        {this.props.section && (
          <Fragment>
            {this.createBreadcrumbPopover()}
          </Fragment>
        )}
      </div>
    );
  }
}
