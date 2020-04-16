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
  EuiHealth,
  EuiTitle,
  EuiToolTip,
  EuiButton,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import '../../common/modules/module.less';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';
import chrome from 'ui/chrome';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { Events, Dashboard, Loader } from '../../common/modules';
import { MainGeneral } from '../../agents/general';
import { MainFim } from '../../agents/fim';
import { MainPm } from '../../agents/pm';
import { MainSca } from '../../agents/sca';
import { MainAudit } from '../../agents/audit';
import { MainOscap } from '../../agents/oscap';
import { MainCiscat } from '../../agents/ciscat';
import { MainVuls } from '../../agents/vuls';
import { MainVirustotal } from '../../agents/virustotal';
import { MainOsquery } from '../../agents/osquery';
import { MainDocker } from '../../agents/docker';
import { MainPci } from '../../agents/pci';
import { MainGdpr } from '../../agents/gdpr';
import { MainHipaa } from '../../agents/hipaa';
import { MainNist } from '../../agents/nist';

export class MainModule extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectView: false,
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
        truncate: true,
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
  }

  color = (status) => {
    if (status.toLowerCase() === 'active') { return 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return 'subdued'; }
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-agent-title">
          <EuiTitle size="s">
            <h1>
              <EuiToolTip position="right" content={this.props.agent.status}>
                <EuiHealth color={this.color(this.props.agent.status)}></EuiHealth>
              </EuiToolTip>
              {this.props.agent.name} ({this.props.agent.id}) - <b>{TabDescription[this.props.section].title}</b>
            </h1>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  setTabs(tabs, buttons) {
    this.buttons = buttons;
    this.tabs = tabs;
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

  renderReportButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          iconType="document"
          onClick={() => this.reportingService.startVis2Png('fim', this.props.agent.id)}>
          Generate report
          </EuiButton>
      </EuiFlexItem>
    );
  }

  renderDashboardButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
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
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
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

  render() {
    const { agent, section } = this.props;
    const { selectView } = this.state;
    const title = this.renderTitle();
    const mainProps = {
      selectView,
      setTabs: (tabs, buttons) => this.setTabs(tabs, buttons),
      onSelectedTabChanged: (id) => this.onSelectedTabChanged(id),
      loadSection: (id) => this.loadSection(id),
      afterLoad: this.afterLoad
    }
    return (
      <Fragment>
        {(agent && agent.os) &&
          <div className='wz-module'>
            <div className='wz-module-header-agent-wrapper'>
              <div className='wz-module-header-agent'>
                {title}
              </div>
            </div>
            <div className='wz-module-header-nav-wrapper'>
              <div className='wz-module-header-nav'>
                {(this.tabs && this.tabs.length) &&
                  <EuiFlexGroup>
                    {this.renderTabs()}
                    {(this.buttons || []).includes('dashboard') && selectView === 'dashboard' &&
                      <Fragment>{this.renderReportButton()}</Fragment>
                    }
                    {(this.buttons || []).includes('dashboard') && this.renderDashboardButton()}
                    {(this.buttons || []).includes('settings') && this.renderSettingsButton()}
                  </EuiFlexGroup>
                }
              </div>
            </div>
            <div className='wz-module-body'>
              {selectView === 'events' && <Events {...this.props} />}
              {selectView === 'loader' &&
                <Loader {...this.props}
                  loadSection={(section) => this.loadSection(section)}
                  redirect={this.afterLoad}>
                </Loader>}
              {selectView === 'dashboard' && <Dashboard {...this.props} />}
              {section === 'general' && <MainGeneral {...{ ...this.props, ...mainProps }} />}
              {section === 'fim' && <MainFim {...{ ...this.props, ...mainProps }} />}
              {section === 'pm' && <MainPm {...{ ...this.props, ...mainProps }} />}
              {section === 'sca' && <MainSca {...{ ...this.props, ...mainProps }} />}
              {section === 'audit' && <MainAudit {...{ ...this.props, ...mainProps }} />}
              {section === 'oscap' && <MainOscap {...{ ...this.props, ...mainProps }} />}
              {section === 'ciscat' && <MainCiscat {...{ ...this.props, ...mainProps }} />}
              {section === 'vuls' && <MainVuls {...{ ...this.props, ...mainProps }} />}
              {section === 'virustotal' && <MainVirustotal {...{ ...this.props, ...mainProps }} />}
              {section === 'osquery' && <MainOsquery {...{ ...this.props, ...mainProps }} />}
              {section === 'docker' && <MainDocker {...{ ...this.props, ...mainProps }} />}
              {section === 'pci' && <MainPci {...{ ...this.props, ...mainProps }} />}
              {section === 'gdpr' && <MainGdpr {...{ ...this.props, ...mainProps }} />}
              {section === 'hipaa' && <MainHipaa {...{ ...this.props, ...mainProps }} />}
              {section === 'nist' && <MainNist {...{ ...this.props, ...mainProps }} />}
            </div>
          </div>
        }
        {(!agent || !agent.os) &&
          <EuiCallOut title=" This agent has never connected" color="warning" iconType="alert">
          </EuiCallOut>
        }
      </Fragment>
    );
  }
}
