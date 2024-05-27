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

import React, { Component } from 'react';
import { EuiFlexItem, EuiTab, EuiTabs } from '@elastic/eui';
import '../../common/modules/module.scss';
import { ReportingService } from '../../../react-services/reporting';
import { ModulesDefaults } from './modules-defaults';
import { getDataPlugin } from '../../../kibana-services';
import { MainModuleAgent } from './main-agent';
import { MainModuleOverview } from './main-overview';
import { compose } from 'redux';
import { withReduxProvider, withErrorBoundary } from '../hocs';

export const MainModule = compose(
  withErrorBoundary,
  withReduxProvider,
)(
  class MainModule extends Component {
    constructor(props) {
      super(props);
      this.reportingService = new ReportingService();
      this.state = {
        selectView: false,
        loadingReport: false,
        switchModule: false,
        showAgentInfo: false,
      };
      if (!(ModulesDefaults[this.props.section] || {}).notModule) {
        this.tabs = (ModulesDefaults[this.props.section] || {}).tabs || [
          { id: 'dashboard', name: 'Dashboard' },
          { id: 'events', name: 'Events' },
        ];
        this.module = ModulesDefaults[this.props.section];
      }
    }

    componentWillUnmount() {
      const { filterManager } = getDataPlugin().query;
      if (filterManager.getFilters() && filterManager.getFilters().length) {
        filterManager.removeAll();
      }
    }

    renderTabs(agent = false) {
      const { selectView } = this.state;
      if (!agent) {
      }
      return (
        <EuiFlexItem style={{ margin: '0 8px 0 8px' }}>
          <EuiTabs>
            {this.tabs.map((tab, index) => {
              if (!tab.onlyAgent || (tab.onlyAgent && this.props.agent)) {
                return (
                  <EuiTab
                    onClick={() => this.onSelectedTabChanged(tab.id)}
                    isSelected={selectView === tab.id}
                    key={index}
                  >
                    {tab.name}
                  </EuiTab>
                );
              }
            })}
          </EuiTabs>
        </EuiFlexItem>
      );
    }

    loadSection(id) {
      this.setState({ selectView: id });
    }

    onSelectedTabChanged(id) {
      if (id !== this.state.selectView) {
        if (id === 'events' || id === 'dashboard' || id === 'inventory') {
          if (this.props.switchSubTab)
            this.props.switchSubTab(
              id === 'events'
                ? 'discover'
                : id === 'inventory'
                ? 'inventory'
                : 'panels',
            );
          this.loadSection(
            id === 'panels' ? 'dashboard' : id === 'discover' ? 'events' : id,
          );
        } else {
          this.loadSection(
            id === 'panels' ? 'dashboard' : id === 'discover' ? 'events' : id,
          );
        }
      }
    }

    render() {
      const { agent } = this.props;
      const { selectView } = this.state;
      const mainProps = {
        selectView,
        tabs: this.tabs,
        module: this.module,
        renderTabs: () => this.renderTabs(),
        loadSection: id => this.loadSection(id),
        onSelectedTabChanged: id => this.onSelectedTabChanged(id),
      };
      return (
        <>
          {(agent && (
            <MainModuleAgent
              {...{ ...this.props, ...mainProps }}
            ></MainModuleAgent>
          )) ||
            (this.props.section && this.props.section !== 'welcome' && (
              <MainModuleOverview
                {...{ ...this.props, ...mainProps }}
              ></MainModuleOverview>
            ))}
        </>
      );
    }
  },
);
