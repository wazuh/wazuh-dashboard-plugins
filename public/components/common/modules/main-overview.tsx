/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
  EuiToolTip,
  EuiIcon
} from '@elastic/eui';
import '../../common/modules/module.scss';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';

import store from '../../../redux/store';
import { ReportingService } from '../../../react-services/reporting';
import { AppNavigate } from '../../../react-services/app-navigate';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import { connect } from 'react-redux';
import { getDataPlugin } from '../../../kibana-services';

interface IProps {
  section: string;
  selectView: string;
  tabs: any;
  buttons: string[];
  agentsSelectionProps: object;
  onSelectedTabChanged(value: string): void;
  renderTabs(): void;
  renderReportButton(): void;
  renderDashboardButton(): void;
}

interface IState {
  selectView: boolean;
  loadingReport: boolean;
  isDescPopoverOpen: boolean;
  showAgentInfo?: boolean;
}
  
const mapStateToProps = (state) => ({
  agent: state.appStateReducers.currentAgentData,
});

export const MainModuleOverview = connect(mapStateToProps)(class MainModuleOverview extends Component<IProps,IState> {
  reportingService: any;
  router: any;
  
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();
    this.state = {
      selectView: false,
      loadingReport: false,
      isDescPopoverOpen: false,
    };
  }

  getBadgeColor(agentStatus) {
    if (agentStatus.toLowerCase() === 'active') {
      return 'secondary';
    } else if (agentStatus.toLowerCase() === 'disconnected') {
      return '#BD271E';
    } else if (agentStatus.toLowerCase() === 'never connected') {
      return 'default';
    }
  }

  setGlobalBreadcrumb() {
    const currentAgent = store.getState().appStateReducers.currentAgentData;
    if (WAZUH_MODULES[this.props.section]) {
      let breadcrumb:any[] = [
        {
          text: '',
        },
        {
          text: 'Modules',
          href: '#/overview'
        },
      ];
      if (currentAgent.id) {
        breadcrumb.push( {
          text: (
            <a
              style={{ margin: '0px 0px -5px 0px', height: 20 }}
              className="euiLink euiLink--subdued euiBreadcrumb "
              onClick={(ev) => { ev.stopPropagation(); AppNavigate.navigateToModule(ev, 'agents', { "tab": "welcome", "agent": currentAgent.id }); this.router.reload(); }}
              id="breadcrumbNoTitle"
            >
              <EuiToolTip position="bottom" content={"View agent summary"}>
                <span>{currentAgent.name}</span>
              </EuiToolTip>
            </a>),
        })
      }
      breadcrumb.push({
        text: (
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <div style={{ margin: '0.8em 0em 0em 0.09em' }}>
              <EuiToolTip position="top">
                <div className="euiBreadcrumb euiBreadcrumb--last" title="">
                  {WAZUH_MODULES[this.props.section].title}
                </div>
              </EuiToolTip>
            </div>
            <EuiToolTip content={WAZUH_MODULES[this.props.section].description}>
                <EuiIcon style={{ margin: '0px 0px 1px 5px' }} type='iInCircle' />
              </EuiToolTip>
          </EuiFlexGroup>
        ),
        truncate: false,
      },)
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    }
  }

  componentDidUpdate() {
    this.setGlobalBreadcrumb();
  }

  async componentDidMount() {
    const tabView = AppNavigate.getUrlParameter('tabView') || 'panels';
    const tab = AppNavigate.getUrlParameter('tab');
    if (tabView && tabView !== this.props.selectView) {
      if (tabView === 'panels' && tab === 'sca') {
        // SCA initial tab is inventory
        this.props.onSelectedTabChanged('inventory');
      } else {
        this.props.onSelectedTabChanged(tabView);
      }
    }

    this.setGlobalBreadcrumb();
    const { filterManager } = getDataPlugin().query;
    this.filterManager = filterManager;
  }

  render() {
    const { section, selectView } = this.props;
    const ModuleTabView = this.props.tabs.find(tab => tab.id === selectView);
    return (
      <div className={this.state.showAgentInfo ? 'wz-module wz-module-showing-agent' : 'wz-module'}>
        <div className={this.props.tabs && this.props.tabs.length && 'wz-module-header-nav'}>
          {this.props.tabs && this.props.tabs.length && (
            <div className="wz-welcome-page-agent-tabs">
              <EuiFlexGroup>
                {this.props.renderTabs()}
                <EuiFlexItem grow={false} style={{ marginTop: 6, marginRight: 5 }}>
                  <EuiFlexGroup>
                    {ModuleTabView && ModuleTabView.buttons && ModuleTabView.buttons.map((ModuleViewButton, index) => 
                      typeof ModuleViewButton !== 'string' ? <EuiFlexItem key={`module_button_${index}`}><ModuleViewButton {...{ ...this.props, ...this.props.agentsSelectionProps }} moduleID={section} /></EuiFlexItem> : null)}
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          )}
        </div>
        {ModuleTabView && ModuleTabView.component && <ModuleTabView.component {...this.props} moduleID={section}/> }
      </div>
    );
  }
})
