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
  EuiButtonIcon,
  EuiTitle,
  EuiPopover,
  EuiBadge,
  EuiPopoverTitle
} from '@elastic/eui';
import '../../common/modules/module.less';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';
import chrome from 'ui/chrome';
import { ReportingService } from '../../../react-services/reporting';
import { AppNavigate } from '../../../react-services/app-navigate';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { Events, Dashboard, Loader, Settings } from '../../common/modules';
import OverviewActions from '../../../controllers/overview/components/overview-actions/overview-actions';
import { MainFim } from '../../agents/fim';

import { MainSca } from '../../agents/sca';
import { MainMitre } from './main-mitre';
import WzReduxProvider from '../../../redux/wz-redux-provider';

export class MainModuleOverview extends Component {
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();
    this.state = {
      selectView: false,
      loadingReport: false,
      isDescPopoverOpen: false,
    };
  }

  getBadgeColor(agentStatus){
    if (agentStatus.toLowerCase() === 'active') { return 'secondary'; }
    else if (agentStatus.toLowerCase() === 'disconnected') { return '#BD271E'; }
    else if (agentStatus.toLowerCase() === 'never connected') { return 'default'; }
  }

  setGlobalBreadcrumb() {
    const currentAgent = store.getState().appStateReducers.currentAgentData;
    if (TabDescription[this.props.currentTab]) {
      let breadcrumb = [
        {
          text: '',
        },
        {
          text: currentAgent.id ? (<span>Modules
            <EuiBadge
            onMouseDown={(ev) =>  {AppNavigate.navigateToModule(ev, 'agents', {"tab": "welcome", "agent": currentAgent.id  } )}}
            color={this.getBadgeColor(currentAgent.status)}>
          {currentAgent.id}
        </EuiBadge></span> ) : 'Modules',
          href: "#/overview"
        },
        {
          text: TabDescription[this.props.section].title
        },
      ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    }
  }

  componentDidUpdate() {
    this.setGlobalBreadcrumb();
  }

  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    this.setGlobalBreadcrumb();
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
                    <span>&nbsp;{TabDescription[this.props.section].title}&nbsp;&nbsp;</span>
                  </h1>
                </EuiTitle>
                <EuiPopover
                  button={
                    <EuiButtonIcon
                      iconType="iInCircle"
                      style={{marginTop: 3}}
                      color='primary'
                      aria-label='Open/close'
                      onClick={() => { this.setState({ isDescPopoverOpen: !this.state.isDescPopoverOpen }) }}
                    />
                  }
                  anchorPosition="rightUp"
                  isOpen={this.state.isDescPopoverOpen}
                  closePopover={() => { this.setState({ isDescPopoverOpen: false }) }}>
                  <EuiPopoverTitle>Module description</EuiPopoverTitle>
                  <div style={{ width: '400px' }}>
                    {TabDescription[this.props.section].description}
                  </div>
                </EuiPopover>
              </span>
            </EuiFlexItem>
            <EuiFlexItem />
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const { section, selectView } = this.props;
    const title = this.renderTitle();
    return (
      <div className={this.state.showAgentInfo ? 'wz-module wz-module-showing-agent' : 'wz-module'}>
        <div className='wz-module-header-agent-wrapper'>
          <div className='wz-module-header-agent'>
            {title}
          </div>
        </div>
        <Fragment>
          <div className='wz-module-header-nav-wrapper'>
            <div className={this.props.tabs && this.props.tabs.length && 'wz-module-header-nav'}>
              {(this.props.tabs && this.props.tabs.length) &&
                <div className="wz-welcome-page-agent-tabs">
                  <EuiFlexGroup>
                    {this.props.renderTabs()}
                    <EuiFlexItem grow={false} style={{ marginTop: 6, marginRight: 5 }}>
                      <WzReduxProvider>
                        <OverviewActions {...{ ...this.props, ...this.props.agentsSelectionProps }} />
                      </WzReduxProvider>
                    </EuiFlexItem>
                    {(selectView === 'dashboard') &&
                      this.props.renderReportButton()
                    }
                    {(this.props.buttons || []).includes('dashboard') &&
                      this.props.renderDashboardButton()
                    }
                  </EuiFlexGroup>
                </div>
              }
            </div>
          </div>
          <div className='wz-module-body'>
            {selectView === 'events' &&
              <Events {...this.props} />
            }
            {selectView === 'loader' &&
              <Loader {...this.props}
                loadSection={(section) => this.props.loadSection(section)}
                redirect={this.props.afterLoad}>
              </Loader>}
            {selectView === 'dashboard' &&
              <Dashboard {...this.props} />
            }
            {selectView === 'settings' &&
              <Settings {...this.props} />
            }
          </div>


          {/* ---------------------MODULES WITH CUSTOM PANELS--------------------------- */}
          {section === 'fim' && <MainFim {...this.props} />}
          {section === 'sca' && <MainSca {...this.props} />}
          
          {section === 'mitre' && selectView === 'inventory' && <MainMitre {...this.props} />}
          {/* -------------------------------------------------------------------------- */}
        </Fragment>
      </div>
    );
  }
}
