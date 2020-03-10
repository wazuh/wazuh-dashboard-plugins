/*
 * Wazuh app - React component for Visualize.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { getServices } from 'plugins/kibana/discover/kibana_services';

import {
  EuiFlexItem,
  EuiKeyPadMenu,
  EuiKeyPadMenuItem,
  EuiIcon,
  EuiOverlayMask,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiTable,
  EuiTableBody,
  EuiTableFooter,
  EuiTableFooterCell,
  EuiTableHeader,
  EuiSwitch,
  EuiTableHeaderCell,
  EuiTableHeaderCellCheckbox,
  EuiTablePagination,
  EuiTableRow,
  EuiModalFooter,
  EuiTableRowCell,
  EuiTableRowCellCheckbox,
  EuiTableSortMobile,
  EuiTableHeaderMobile,
} from '@elastic/eui';
import './visualize-top-menu.less';
import { AgentSelectionTable } from './visualize-agent-selection-table';
export class VisualizeTopMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: this.props.tab || '',
      subtab: this.props.subtab || '',
      isAgentModalVisible: false,
    };
  }

  /**
   * Compares the new applied filters with the previous filters to detect if any filter has been added.
   * If a 'agent.id' filter has been added, we update the parent component with this information.
   */
  agentsFilterAdded() {
    let result = [];
    const addedFilters = this.state.filterManager.filters.filter(item => {
      // get the filters that have been added
      return !this.state.oldFilters.some(oldItem => {
        return JSON.stringify(oldItem.query) === JSON.stringify(item.query);
      });
    });
    const isAgentFilter = addedFilters.filter(item => {
      // we are only interested in 'agent.id' filters
      return item.meta.key === 'agent.id';
    });
    const isAgentFilterIs = isAgentFilter.filter(item => {
      // 'agent.id is X' filter
      return item.meta.type === 'phrase' && !item.meta.negate;
    });
    if (isAgentFilterIs.length) {
      result = [isAgentFilterIs[0].meta.params.query];
    }

    const isAgentFilterIsOneOf = isAgentFilter.filter(item => {
      // agent.id is one of [X,Y,Z]
      return item.meta.type === 'phrases' && !item.meta.negate;
    });
    if (isAgentFilterIsOneOf.length) {
      result = [...isAgentFilterIsOneOf[0].meta.params];
    }
    if(result.length)
      this.updateAgentSearch(result);
  }

  /**
   * Compares the new applied filters with the previous filters to detect if any filter has been removed.
   * If a 'agent.id' filter has been removed, we update the parent component.
   */
  agentsFilterRemoved() {
    // get the filters that have been removed
    const removedFilters = this.state.oldFilters.filter(item => {
      return !this.state.filterManager.filters.some(oldItem => {
        return JSON.stringify(oldItem.query) === JSON.stringify(item.query);
      });
    });

    const isAgentFilter = removedFilters.filter(item => {
      return item.meta.key === 'agent.id';
    });
    if (isAgentFilter.length) {
      //this.removeAgentsFilter();
      //this.props.setAgent(false);
      //this.setState({ isAgent: false });
    }
  }

  /**
   * Compares the new applied filters with the previous filters to detect if any filter has been modified.
   * If a 'agent.id' filter has been modified, we update the parent component.
   */
  agentsFilterModified() {
    const modifiedFilters = this.state.filterManager.filters.filter(item => {
      // get the filters that have been added
      return this.state.oldFilters.some(oldItem => {
        return (
          oldItem.meta.key === 'agent.id' &&
          item.meta.key === 'agent.id' &&
          JSON.stringify(oldItem.query) !== JSON.stringify(item.query)
        );
      });
    });
    const result = [];

    const isAgentFilterIs = modifiedFilters.filter(item => {
      // 'agent.id is X' filter
      return item.meta.type === 'phrase' && !item.meta.negate;
    });
    if (isAgentFilterIs.length) {
      result = [isAgentFilterIs[0].meta.params.query];
    }

    const isAgentFilterIsOneOf = modifiedFilters.filter(item => {
      // agent.id is one of [X,Y,Z]
      return item.meta.type === 'phrases' && !item.meta.negate;
    });
    if (isAgentFilterIsOneOf.length) {
      result = [...isAgentFilterIsOneOf[0].meta.params];
    }
    if (result.length) this.updateAgentSearch(result);
  }

  onFilterUpdate() {
    const areAgentsFilter = this.state.filterManager.filters.filter(item => {
      return item.meta.key === 'agent.id';
    });
    if(!areAgentsFilter.length){
      this.props.setAgent(false);
      this.setState({isAgent: false});
    }
    if(areAgentsFilter.length){
      const agentsList = areAgentsFilter[0].meta.params.query ? [areAgentsFilter[0].meta.params.query] : areAgentsFilter[0].meta.params; 
      this.props.setAgent(agentsList);
    } 

    if (this.state.oldFilters) {
      // if oldFilters length is less than current filters, it means some filters have been added
      if (this.state.oldFilters.length < this.state.filterManager.filters.length) {
        this.agentsFilterAdded();
      }

      // if oldFilters length is higher than current filters, it means some filters have been removed
      if (this.state.oldFilters.length > this.state.filterManager.filters.length) {
        this.agentsFilterRemoved();
      }

      //if oldFilters length is the same as the current filters length, updated a filter?
      if (this.state.oldFilters.length === this.state.filterManager.filters.length) {
        //this.agentsFilterModified();
        // TODO handle modified
      }
    }
    this.setState({ oldFilters: this.state.filterManager.filters });
  }

  removeAgentsFilter() {
    //this.props.buildOverview();
    const currentAppliedFilters = this.state.filterManager.filters;
    const agentFilters = currentAppliedFilters.filter(x => {
      return x.meta.key === 'agent.id';
    });
    agentFilters.map(x => {
      this.state.filterManager.removeFilter(x);
    });
  }

  componentDidMount() {
    const { filterManager } = getServices();
    const filterUpdateSubscriber = filterManager.updated$.subscribe(x => {
      this.onFilterUpdate();
    });

    this.setState({ filterUpdateSubscriber, filterManager: filterManager });
  }

  componentWillUnmount() {
    this.state.filterUpdateSubscriber.unsubscribe();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.tab) {
      this.setState({
        tab: nextProps.tab,
      });
    }
    if (nextProps.subtab) {
      this.setState({
        subtab: nextProps.subtab,
      });
    }
  }

  closeAgentModal() {
    this.setState({ isAgentModalVisible: false });
  }

  showAgentModal() {
    this.setState({ isAgentModalVisible: true });
  }

  updateAgentSearch(agentsIdList) {
    //this.closeAgentModal();
    if (agentsIdList) {
      //this.props.setAgent(agentsIdList);
      this.setState({ isAgent: agentsIdList });
    }
  }

  agentTableSearch(agentIdList){
    this.closeAgentModal();
    if(agentIdList && agentIdList.length){
      if(agentIdList.length === 1){
        const filter = {
          "meta": {
            "alias":null,
            "disabled":false,
            "key":"agent.id",
            "negate":false,
            "params":{"query": agentIdList[0]},
            "type":"phrase",
            "index":"wazuh-alerts-3.x-*"
          },
          "query":{"match_phrase":{"agent.id": agentIdList[0]}},
          "$state": {"store":"appState"}
        };
        this.state.filterManager.addFilters(filter);
      }else if(agentIdList.length > 1){
        const agentsListString = agentIdList.map(item => {return item.toString()})
        const agentsListFormatted = agentIdList.map(item => {return { "match_phrase": {"agent.id": item.toString()}}})
        const filter = {
          "meta": {
            "alias":null,
            "disabled":false,
            "key":"agent.id",
            "negate":false,
            "params": agentsListString,
            "value": agentIdList.toString(),
            "type":"phrases",
            "index":"wazuh-alerts-3.x-*"
          },
          "query":{"bool":{"minimum_should_match": 1, "should": agentsListFormatted}},
          "$state": {"store":"appState"}
        };
        this.state.filterManager.addFilters(filter);
      }
    }

    this.setState({ isAgent: agentIdList });
  }

  getSelectedAgents() {
    let selectedAgentsObject = {};
    for (var i = 0; this.state.isAgent && this.state.isAgent.length && i < this.state.isAgent.length; ++i) selectedAgentsObject[this.state.isAgent[i]] = true;
    return selectedAgentsObject;
  }

  render() {
    let modal;

    if (this.state.isAgentModalVisible) {
      modal = (
        <EuiOverlayMask>
          <EuiModal
            maxWidth="800px"
            onClose={() => this.closeAgentModal()}
            initialFocus="[name=popswitch]"
          >
            <EuiModalHeader>
              <EuiModalHeaderTitle>Filter dashboards by agent</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <AgentSelectionTable
                updateAgentSearch={agentsIdList => this.agentTableSearch(agentsIdList)}
                removeAgentsFilter={() => this.removeAgentsFilter()}
                selectedAgents={this.getSelectedAgents()}
              ></AgentSelectionTable>
            </EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      );
    }
    return (
      <div style={{marginBottom: 8}}>
        <EuiFlexItem>
          <EuiKeyPadMenu className="VisualizeTopMenu">
            {!this.state.isAgent && (
              <EuiKeyPadMenuItem label="Agents" onClick={() => this.showAgentModal()}>
                <EuiIcon type="watchesApp" color="primary" size="m" />
              </EuiKeyPadMenuItem>
            )}
            {this.state.isAgent && (
              <div className="TopMenuAgent">
                <EuiKeyPadMenuItem
                  label="Filter by agents"
                  onClick={() => this.showAgentModal()}
                  betaBadgeLabel="Filter by agents"
                  betaBadgeTooltipContent={`Click here to filter by agents.`}
                  betaBadgeIconType="merge"
                >
                  <EuiIcon type="watchesApp" color="primary" size="m" />
                </EuiKeyPadMenuItem>
                <EuiKeyPadMenuItem
                  label="Remove agents"
                  onClick={() => {
                    this.removeAgentsFilter();
                    //this.props.setAgent(false);
                    this.setState({ isAgent: false });
                  }}
                  betaBadgeLabel="Remove all agents"
                  betaBadgeTooltipContent={`Click here to remove all applied agents filters.`}
                  betaBadgeIconType="cross"
                >
                  <EuiIcon type="watchesApp" color="primary" size="m" />
                </EuiKeyPadMenuItem>
              </div>
            )}
            {this.state.subtab === 'panels' && (
              <EuiKeyPadMenuItem isDisabled label="Report">
                <EuiIcon type="reportingApp" color="primary" size="m" />
              </EuiKeyPadMenuItem>
            )}
            <EuiKeyPadMenuItem
              label={this.state.subtab === 'discover' ? 'Dashboard' : 'Discover'}
              onClick={() =>
                this.props.switchDiscover(this.state.subtab === 'discover' ? 'panels' : 'discover')
              }
            >
              <EuiIcon
                type={this.state.subtab === 'discover' ? 'visualizeApp' : 'discoverApp'}
                color="primary"
                size="m"
              />
            </EuiKeyPadMenuItem>
          </EuiKeyPadMenu>
        </EuiFlexItem>
        {modal}
      </div>
    );
  }
}
