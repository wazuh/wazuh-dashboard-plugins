/*
 * Wazuh app - React component for building the reporting view
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, useState, useEffect } from "react";
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiPanel,
  EuiTitle,
  EuiPage,
  EuiText,
  EuiCallOut,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiSelect,
  EuiProgress
} from "@elastic/eui";

import { clusterNodes } from "../configuration/utils/wz-fetch";
import { WzStatisticsRemoted } from "./statistics-dashboard-remoted";
import { WzStatisticsAnalysisd } from "./statistics-dashboard-analysisd";
import { WzDatePicker } from "../../../../../components/wz-date-picker/wz-date-picker";
import { AppNavigate } from "../../../../../react-services/app-navigate";
import { compose } from 'redux';
import { withGuard, withGlobalBreadcrumb } from "../../../../../components/common/hocs";
import { PromptStatisticsDisabled } from './prompt-statistics-disabled';
import { PromptStatisticsNoIndices } from './prompt-statistics-no-indices';
import { WazuhConfig } from "../../../../../react-services/wazuh-config";
import { WzRequest } from '../../../../../react-services/wz-request';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
const wzConfig = new WazuhConfig();

export class WzStatisticsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: "remoted",
      stats: {},
      isLoading: false,
      loadingNode: false,
      searchvalue: "",
      clusterNodeSelected: 'all',
      refreshVisualizations: Date.now()
    };
    this.tabs = [
      {
        id: "remoted",
        name: "Listener Engine",
      },
      {
        id: "analysisd",
        name: "Analysis Engine",
      },
    ];

    this.info = {
      remoted:
        "Remoted statistics are cumulative, this means that the information shown is since the data exists.",
      analysisd:
        "Analysisd statistics refer to the data stored from the period indicated in the variable 'analysisd.state_interval'.",
    };
  }

  async componentDidMount() {
    this._isMounted = true;
    try {
      const data = await clusterNodes();
      const nodes = data.data.data.affected_items.map((item) => {
        return { value: item.name, text: `${item.name} (${item.type})` };
      });
      nodes.unshift({ value: 'all', text: 'All' })
      this.setState({
        clusterNodes: nodes,
        clusterNodeSelected: nodes[0].value,
      });
    } catch (error) {
      this.setState({
        clusterNodes: [],
        clusterNodeSelected: 'all',
      });

      const options = {
        context: `${WzStatisticsOverview.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onSelectedTabChanged = (id) => {
    this.setState(
      {
        selectedTabId: id,
        searchvalue: "",
      }
    );
  };

  renderTabs() {
    return this.tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        key={index}
      >
        {tab.name}
      </EuiTab>
    ));
  }

  onSelectNode = (e) => {
    const newValue = e.target.value;
    this.setState(
      {
        loadingNode: true
      },
      () => {
        this.setState({ clusterNodeSelected: newValue, loadingNode: false })
      }
    );
  };

  refreshVisualizations = () => {
    this.setState({ refreshVisualizations: Date.now() })
  }

  render() {
    const search = {
      box: {
        incremental: true,
        schema: true,
      },
    };
    return (
      <EuiPage style={{ background: "transparent" }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>Statistics</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="refresh"
                onClick={this.refreshVisualizations}
              >
                Refresh
              </EuiButtonEmpty>
            </EuiFlexItem>
            {!!(
              this.state.clusterNodes &&
              this.state.clusterNodes.length &&
              this.state.clusterNodeSelected
            ) && (
                <EuiFlexItem grow={false}>
                  <EuiSelect
                    id="selectNode"
                    options={this.state.clusterNodes}
                    value={this.state.clusterNodeSelected}
                    onChange={this.onSelectNode}
                    aria-label="Select node"
                  />
                </EuiFlexItem>
              )}
            <EuiFlexItem grow={false}>
              <WzDatePicker condensed={true} onTimeChange={() => { }} />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onMouseDown={e => AppNavigate.navigateToModule(e, 'settings', { tab: 'configuration', category: 'statistics' })}
                iconType="gear"
                iconSide="left" >
                Settings
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued">
                From here you can see daemon statistics.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTabs>{this.renderTabs()}</EuiTabs>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size={"m"} />
          {(
            <>
              {this.state.selectedTabId === "remoted" && !this.state.loadingNode && (
                <div>
                  <EuiSpacer size={"m"} />
                  <EuiCallOut
                    title={this.info[this.state.selectedTabId]}
                    iconType="iInCircle"
                  />
                  <EuiSpacer size={"m"} />
                  <WzStatisticsRemoted clusterNodeSelected={this.state.clusterNodeSelected} refreshVisualizations={this.state.refreshVisualizations}/>
                </div>
              )}
              {this.state.selectedTabId === "analysisd" && !this.state.loadingNode && (
                <div>
                  <EuiSpacer size={"m"} />
                  <EuiCallOut
                    title={this.info[this.state.selectedTabId]}
                    iconType="iInCircle"
                  />
                  <EuiSpacer size={"m"} />
                  <WzStatisticsAnalysisd clusterNodeSelected={this.state.clusterNodeSelected} refreshVisualizations={this.state.refreshVisualizations}/>
                </div>
              )}
            </>
          )}
        </EuiPanel>
      </EuiPage>
    );
  }
}

export default compose(
  withGlobalBreadcrumb([
    { text: '' },
    { text: 'Management', href: '#/manager' },
    { text: 'Statistics' }
  ]),
  withGuard(props => {
    return !((wzConfig.getConfig() || {})['cron.statistics.status']); // if 'cron.statistics.status' is false, then it renders PromptStatisticsDisabled component
  }, PromptStatisticsDisabled)
)(
  props => {
    const [loading, setLoading] = useState(false);
    const [existStatisticsIndices, setExistStatisticsIndices] = useState(false);
    useEffect(() => {
      const fetchData = async () => {
        try{
          setLoading(true);
          const data = await WzRequest.genericReq('GET', '/elastic/statistics');
          setExistStatisticsIndices(data.data);
        }catch(error){
          setLoading(false);
          const options = {
            context: `${WzStatisticsOverview.name}.fetchData`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            error: {
              error: error,
              message: error.message || error,
              title: `${error.name}: Error when fetching data`
            },
          };
          getErrorOrchestrator().handleError(options);
        }
        setLoading(false);
      };
  
      fetchData();
    }, []);
    if(loading){
      return <EuiProgress size="xs" color="primary" />
    }
    return existStatisticsIndices ? <WzStatisticsOverview {...props}/> : <PromptStatisticsNoIndices {...props}/>
  }
);
