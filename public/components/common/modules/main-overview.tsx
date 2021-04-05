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
import '../../common/modules/module.scss';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';
import { ReportingService } from '../../../react-services/reporting';
import { AppNavigate } from '../../../react-services/app-navigate';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import { Events, Dashboard, Loader, Settings } from '../../common/modules';
import OverviewActions from '../../../controllers/overview/components/overview-actions/overview-actions';
import { MainFim } from '../../agents/fim';

import { MainSca } from '../../agents/sca';
import { MainMitre } from './main-mitre';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { ComplianceTable } from '../../overview/compliance-table';

import { withAgentSupportModule } from '../../../components/common/hocs';
import { connect } from 'react-redux';
import { compose } from 'redux';

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
    if (WAZUH_MODULES[this.props.currentTab]) {
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
          text: WAZUH_MODULES[this.props.section].title
        },
      ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    }
  }

  componentDidUpdate() {
    this.setGlobalBreadcrumb();
  }

  async componentDidMount() {
    const tabView = AppNavigate.getUrlParameter('tabView') || 'panels';
    const tab = AppNavigate.getUrlParameter('tab');
    if(tabView && tabView !== this.props.selectView){
      if(tabView === 'panels' && tab=== 'sca' ){ // SCA initial tab is inventory
        this.props.onSelectedTabChanged('inventory');
      }else{
        this.props.onSelectedTabChanged(tabView);
      }
    }
    
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
                    <span>&nbsp;{WAZUH_MODULES[this.props.section].title}&nbsp;&nbsp;</span>
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
                    {WAZUH_MODULES[this.props.section].description}
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
            <ModuleTabViewer component={section} {...this.props}/>
          </div>
        </Fragment>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData
});

const ModuleTabViewer = compose(
  connect(mapStateToProps),
  withAgentSupportModule
)((props) => {
  const { section, selectView } = props;
  return <>
      {selectView === 'events' &&
        <Events {...props} />
      }
      {selectView === 'loader' &&
        <Loader {...props}
          loadSection={(section) => props.loadSection(section)}
          redirect={props.afterLoad}>
        </Loader>}
      {selectView === 'dashboard' &&
        <Dashboard {...props} />
      }
      {selectView === 'settings' &&
        <Settings {...props} />
      }


      {/* ---------------------MODULES WITH CUSTOM PANELS--------------------------- */}
      {section === 'fim' && selectView==='inventory' && <MainFim {...props} />}
      {section === 'sca' && selectView==='inventory' && <MainSca {...props} />}
      
      {section === 'mitre' && selectView === 'inventory' && <MainMitre {...props} />}
      {['pci', 'gdpr', 'hipaa', 'nist', 'tsc'].includes(section) && selectView === 'inventory' && <ComplianceTable {...props} goToDiscover={(id) => props.onSelectedTabChanged(id)} />}
      {/* -------------------------------------------------------------------------- */}
    </>
})
