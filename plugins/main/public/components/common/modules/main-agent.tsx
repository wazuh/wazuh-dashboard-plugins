/*
 * Wazuh app - Integrity monitoring components
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiTitle,
  EuiButtonEmpty,
} from '@elastic/eui';
import '../../common/modules/module.scss';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';
import { FilterHandler } from '../../../utils/filter-handler';
import { AppState } from '../../../react-services/app-state';
import { ReportingService } from '../../../react-services/reporting';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import { AgentInfo } from '../../common/welcome/agents-info';
import { getAngularModule } from '../../../kibana-services';

export class MainModuleAgent extends Component {
  props!: {
    [key: string]: any;
  };
  state: {
    selectView: Boolean;
    loadingReport: Boolean;
    switchModule: Boolean;
    showAgentInfo: Boolean;
  };
  reportingService: ReportingService;
  filterHandler: FilterHandler;

  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.state = {
      selectView: false,
      loadingReport: false,
      switchModule: false,
      showAgentInfo: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.section !== this.props.section) {
      this.setGlobalBreadcrumb();
    }
  }

  setGlobalBreadcrumb() {
    let breadcrumb;
    if (this.props.section === 'welcome') {
      breadcrumb = [
        { text: '' },
        { text: 'Endpoints summary', href: '#/agents-preview' },
        { text: this.props.agent.id },
      ];
    } else {
      breadcrumb = [
        {
          text: '',
        },
        {
          text: 'IT Hygiene',
        },
        { agent: this.props.agent },
        {
          text: WAZUH_MODULES[this.props.section].title,
        },
      ];
    }
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    $('#breadcrumbNoTitle').attr('title', '');
  }

  async componentDidMount() {
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
    this.setGlobalBreadcrumb();
  }

  showAgentInfo() {
    const elem = document.getElementsByClassName('wz-module-body-main')[0];
    if (elem) {
      if (!this.state.showAgentInfo) {
        elem.classList.add('wz-module-body-main-double');
      } else {
        elem.classList.remove('wz-module-body-main-double');
      }
    }
    this.setState({ showAgentInfo: !this.state.showAgentInfo });
  }

  async startReport() {
    this.setState({ loadingReport: true });
    const syscollectorFilters: any[] = [];
    const agent =
      (
        this.props.agent ||
        store.getState().appStateReducers.currentAgentData ||
        {}
      ).id || false;
    if (this.props.section === 'syscollector' && agent) {
      syscollectorFilters.push(this.filterHandler.managerQuery(agent, true));
      syscollectorFilters.push(this.filterHandler.agentQuery(agent));
    }
    await this.reportingService.startVis2Png(
      this.props.section,
      agent,
      syscollectorFilters.length ? syscollectorFilters : null,
    );
    this.setState({ loadingReport: false });
  }

  renderReportButton() {
    return (
      this.props.section === 'syscollector' && (
        <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
          <EuiButtonEmpty
            iconType='document'
            isLoading={this.state.loadingReport}
            onClick={async () => this.startReport()}
          >
            Generate report
          </EuiButtonEmpty>
        </EuiFlexItem>
      )
    );
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className='wz-module-header-agent-title'>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <span style={{ display: 'inline-flex' }}>
                <EuiTitle size='s' className='wz-module-header-agent-title-btn'>
                  <h1>
                    <span
                      onClick={() => {
                        window.location.href = `#/agents?agent=${this.props.agent.id}`;
                        this.router.reload();
                      }}
                    >
                      <span>
                        &nbsp;{this.props.agent.name}&nbsp;&nbsp;&nbsp;
                      </span>
                    </span>
                  </h1>
                </EuiTitle>
              </span>
            </EuiFlexItem>
            <EuiFlexItem />
            {this.renderReportButton()}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const { agent, section, selectView } = this.props;
    const title = this.renderTitle();
    const ModuleTabView = (this.props.tabs || []).find(
      tab => tab.id === selectView,
    );
    return (
      <div
        className={
          this.state.showAgentInfo
            ? 'wz-module wz-module-showing-agent'
            : 'wz-module'
        }
      >
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent'>{title}</div>
        </div>
        {agent && agent.os && (
          <Fragment>
            <div className='wz-module-header-nav-wrapper'>
              <div
                className={
                  this.props.tabs &&
                  this.props.tabs.length &&
                  'wz-module-header-nav'
                }
              >
                {this.state.showAgentInfo && (
                  <div
                    className={
                      !this.props.tabs || !this.props.tabs.length
                        ? 'wz-welcome-page-agent-info'
                        : 'wz-welcome-page-agent-info wz-welcome-page-agent-info-gray'
                    }
                  >
                    <AgentInfo
                      agent={this.props.agent}
                      isCondensed={false}
                      hideActions={true}
                      {...this.props}
                    ></AgentInfo>
                  </div>
                )}
                {this.props.tabs && this.props.tabs.length && (
                  <div className='wz-welcome-page-agent-tabs'>
                    <EuiFlexGroup>
                      {this.props.renderTabs()}
                      <EuiFlexItem
                        grow={false}
                        style={{ marginTop: 6, marginRight: 5 }}
                      >
                        <EuiFlexGroup>
                          {ModuleTabView &&
                            ModuleTabView.buttons &&
                            ModuleTabView.buttons.map(
                              (ModuleViewButton, index) =>
                                typeof ModuleViewButton !== 'string' ? (
                                  <EuiFlexItem key={`module_button_${index}`}>
                                    <ModuleViewButton
                                      {...{
                                        ...this.props,
                                        ...this.props.agentsSelectionProps,
                                      }}
                                      moduleID={section}
                                    />
                                  </EuiFlexItem>
                                ) : null,
                            )}
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
                )}
              </div>
            </div>
            {!['syscollector', 'configuration'].includes(section) &&
              ModuleTabView &&
              ModuleTabView.component && (
                <ModuleTabView.component {...this.props} moduleID={section} />
              )}
          </Fragment>
        )}
        {(!agent || !agent.os) && (
          <EuiCallOut
            style={{ margin: '66px 16px 0 16px' }}
            title='This agent has never connected'
            color='warning'
            iconType='alert'
          ></EuiCallOut>
        )}
      </div>
    );
  }
}
