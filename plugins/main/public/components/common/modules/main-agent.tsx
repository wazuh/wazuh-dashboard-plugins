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
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiTabs,
  EuiTab,
  EuiLoadingSpinner,
} from '@elastic/eui';
import '../../common/modules/module.scss';
import store from '../../../redux/store';
import { ReportingService } from '../../../react-services/reporting';
import { AgentInfo } from '../welcome/agent-info/agents-info';
import {
  AlertsDataSource,
  AlertsDataSourceRepository,
  PatternDataSource,
  tFilter,
  tParsedIndexPattern,
  useDataSource,
} from '../data-source';
import { useAsyncAction } from '../hooks';
import { toTitleCase } from '../util/change-case';
import clsx from 'clsx';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';
import { Agent } from '../../endpoints-summary/types';

export class MainModuleAgent extends Component {
  props!: {
    agent: Agent;
    section: string;
    switchTab?: (tab: string) => void;
    selectView?: boolean;
    tabs?: any[];
    renderTabs?: () => JSX.Element;
    agentsSelectionProps?: any;
  };
  state: {
    selectView: Boolean;
    loadingReport: Boolean;
    showAgentInfo: Boolean;
  };

  constructor(props) {
    super(props);
    this.state = {
      selectView: false,
      loadingReport: false,
      showAgentInfo: false,
    };
  }

  inventoryTabs = [AgentTabs.SOFTWARE, AgentTabs.NETWORK, AgentTabs.PROCESSES];

  renderTitle() {
    return (
      <EuiFlexGroup style={{ marginInline: 8 }}>
        <EuiFlexItem style={{ marginInline: 0 }} grow={false}>
          {this.state.loadingReport ? (
            <EuiLoadingSpinner size='s' />
          ) : (
            <EuiTabs>
          <EuiTabs data-test-subj='report-tabs'>
              {this.inventoryTabs.includes(this.props.section) ? (
                <>
                  {this.inventoryTabs.map(tab => (
                    <EuiTab
                    data-test-subj={`report-tab-${tab}`}
                      isSelected={this.props.section === tab}
                      onClick={() => this.props.switchTab?.(tab)}
                    >
                      {toTitleCase(tab)}&nbsp;
                    </EuiTab>
                  ))}
                </>
              ) : (
              <EuiTab data-test-subj='report-tab-overview' isSelected={true}>
                  {toTitleCase(this.props.section)}&nbsp;
                </EuiTab>
              )}
            </EuiTabs>
          )}
        </EuiFlexItem>
        <EuiFlexItem />
        {[
          AgentTabs.SOFTWARE,
          AgentTabs.NETWORK,
          AgentTabs.PROCESSES,
          AgentTabs.CONFIGURATION,
          AgentTabs.STATS,
        ].includes(this.props.section) && (
          <EuiFlexItem
            grow={false}
            style={{ marginTop: 13.25, marginInline: 0 }}
          >
            <GenerateReportButton agent={this.props.agent} />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }

  render() {
    const { agent, section, selectView } = this.props;
    const ModuleTabView = this.props.tabs?.find(tab => tab.id === selectView);

    const hasTabs = this.props.tabs?.length;

    return (
      <div
        className={
          this.state.showAgentInfo
            ? 'wz-module wz-module-showing-agent'
            : 'wz-module'
        }
      >
        {agent?.os && (
          <Fragment>
            <div className='wz-module-header-agent-wrapper'>
              <div className='wz-module-header-agent'>{this.renderTitle()}</div>
            </div>
            <div>
              <div className={clsx({ 'wz-module-header-nav': hasTabs })}>
                {this.state.showAgentInfo && (
                  <EuiPanel grow paddingSize='s'>
                    <AgentInfo
                      agent={this.props.agent}
                      isCondensed={false}
                      hideActions={true}
                      {...this.props}
                    ></AgentInfo>
                  </EuiPanel>
                )}
                {hasTabs && (
                  <div className='wz-welcome-page-agent-tabs'>
                    <EuiFlexGroup>
                      {this.props.renderTabs()}
                      <EuiFlexItem
                        grow={false}
                        style={{ marginTop: 6, marginRight: 5 }}
                      >
                        <EuiFlexGroup>
                          {ModuleTabView?.buttons?.map(
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
            {[AgentTabs.STATS].includes(section) &&
              ModuleTabView?.component && (
                <ModuleTabView.component {...this.props} moduleID={section} />
              )}
          </Fragment>
        )}
      </div>
    );
  }
}

export class AgentInventoryDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [
      ...super.getFixedFiltersClusterManager(),
      ...super.getFixedFilters(),
    ];
  }
}

const GenerateReportButton = ({ agent }: { agent: Agent }) => {
  const {
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    repository: new AlertsDataSourceRepository(), // this makes only works with alerts index pattern
    DataSource: AgentInventoryDataSource,
  });

  const action = useAsyncAction(async () => {
    const reportingService = new ReportingService();
    const agentID =
      (agent || store.getState().appStateReducers.currentAgentData || {}).id ||
      false;
    await reportingService.startVis2Png('syscollector', agentID, {
      indexPattern: dataSource?.indexPattern,
      query: { query: '', language: 'kuery' },
      filters: fetchFilters,
      time: {
        from: 'now-1d/d',
        to: 'now',
      },
    });
  }, [dataSource]);

  return (
    <EuiButtonEmpty
      data-test-subj='generate-report-button'
      iconType='document'
      isLoading={action.running}
      isDisabled={isDataSourceLoading}
      onClick={action.run}
    >
      Generate report
    </EuiButtonEmpty>
  );
};
