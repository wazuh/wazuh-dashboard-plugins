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
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import '../../common/modules/module.scss';
import { ReportingService } from '../../../react-services/reporting';
import { AppNavigate } from '../../../react-services/app-navigate';
import { connect } from 'react-redux';
import { getDataPlugin } from '../../../kibana-services';

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData,
});

export const MainModuleOverview = connect(mapStateToProps)(
  class MainModuleOverview extends Component {
    constructor(props) {
      super(props);
      this.reportingService = new ReportingService();
      this.state = {
        selectView: false,
        loadingReport: false,
        isDescPopoverOpen: false,
      };
    }

    async componentDidMount() {
      const { module } = this.props;
      const tabView = AppNavigate.getUrlParameter('tabView') || 'panels';
      const tab = AppNavigate.getUrlParameter('tab');
      const tabExceptions = ['sca', 'vuls'];
      if (tabView && tabView !== this.props.selectView) {
        if (tabView === 'panels' && tabExceptions.includes(tab)) {
          // SCA & Vulnerabilities initial tab is inventory
          this.props.onSelectedTabChanged(module.init);
        } else {
          this.props.onSelectedTabChanged(tabView);
        }
      }

      const { filterManager } = getDataPlugin().query;
      this.filterManager = filterManager;
    }

    render() {
      const { section, selectView } = this.props;
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
          <div
            className={
              this.props.tabs &&
              this.props.tabs.length &&
              'wz-module-header-nav'
            }
          >
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
                        ModuleTabView.buttons.map((ModuleViewButton, index) =>
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
          {ModuleTabView && ModuleTabView.component && (
            <ModuleTabView.component {...this.props} moduleID={section} />
          )}
        </div>
      );
    }
  },
);
