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
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import '../../common/modules/module.scss';
import store from '../../../redux/store';
import { FilterHandler } from '../../../utils/filter-handler';
import { AppState } from '../../../react-services/app-state';
import { ReportingService } from '../../../react-services/reporting';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import { AgentInfo } from '../../common/welcome/agents-info';
import { getAngularModule, getCore } from '../../../kibana-services';
import { compose } from 'redux';
import { withGlobalBreadcrumb } from '../hocs';
import { endpointSummary } from '../../../utils/applications';
import {
  AlertsDataSource,
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../data-source';
import { useAsyncAction } from '../hooks';

interface MainModuleAgentProps {
  agent: any;
  section: string;
  selectView: boolean;
  tabs?: any[];
  renderTabs: () => React.ReactNode;
}

interface MainModuleAgentState {
  selectView: boolean;
  loadingReport: boolean;
  switchModule: boolean;
  showAgentInfo: boolean;
}

export class MainModuleAgent extends Component<
  MainModuleAgentProps,
  MainModuleAgentState
> {
  isMounted: boolean;
  reportingService: ReportingService;
  filterHandler: FilterHandler;
  router: any;

  constructor(props: MainModuleAgentProps) {
    super(props);
    this.reportingService = new ReportingService();
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.state = {
      selectView: false,
      loadingReport: false,
      switchModule: false,
      showAgentInfo: false,
    };
    this.isMounted = false;
  }

  async componentDidMount() {
    this.isMounted = true;
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
  }

  componentWillUnmount() {
    this.isMounted = false;
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
                      style={{ color: euiThemeVars.euiColorPrimaryText }}
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
            {this.props.section === 'syscollector' && (
              <EuiFlexItem
                grow={false}
                style={{ marginRight: 4, marginTop: 6 }}
              >
                <GenerateSyscollectorReportButton agent={this.props.agent} />
              </EuiFlexItem>
            )}
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
            <div>
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

export default compose(
  withGlobalBreadcrumb(({ agent, section }) => {
    if (section === 'welcome') {
      return [
        {
          text: endpointSummary.breadcrumbLabel,
          href: getCore().application.getUrlForApp(endpointSummary.id, {
            path: `#/agents-preview`,
          }),
        },
        { text: agent.id },
      ];
    } else {
      return [
        {
          text: endpointSummary.breadcrumbLabel,
          href: getCore().application.getUrlForApp(endpointSummary.id, {
            path: `#/agents-preview`,
          }),
        },
        { agent: agent },
        {
          text: WAZUH_MODULES[section].title,
        },
      ];
    }
  }),
)(MainModuleAgent);

const GenerateSyscollectorReportButton = ({ agent }) => {
  const {
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    repository: new AlertsDataSourceRepository(), // this makes only works with alerts index pattern
    DataSource: AlertsDataSource,
  });

  const action = useAsyncAction(async () => {
    const reportingService = new ReportingService();
    const agentID =
      (agent || store.getState().appStateReducers.currentAgentData || {}).id ||
      false;
    await reportingService.startVis2Png('syscollector', agentID, {
      indexPattern: dataSource.indexPattern,
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
      iconType='document'
      isLoading={action.running}
      isDisabled={isDataSourceLoading}
      onClick={action.run}
    >
      Generate report
    </EuiButtonEmpty>
  );
};
