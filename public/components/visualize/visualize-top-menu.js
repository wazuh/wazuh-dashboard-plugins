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

  onFilterUpdate() {
    console.log('filters were updated', this.state.filterManager.filters);
    if (this.state.oldFilters) {
      // if oldFilters length is less than current filters, it means some filters have been added
      if (this.state.oldFilters.length < this.state.filterManager.filters.length) {
        // get the filters that have been added
        const addedFilters = this.state.filterManager.filters.filter(item => {
          return !this.state.oldFilters.some(oldItem => {
            return JSON.stringify(oldItem.query) === JSON.stringify(item.query);
          });
        });
        console.log(addedFilters)
      }

      // if oldFilters length is higher than current filters, it means some filters have been removed
      if (this.state.oldFilters.length > this.state.filterManager.filters.length) {
        // get the filters that have been removed
        const removedFilters = this.state.oldFilters.filter(item => {
          return !this.state.filterManager.filters.some(oldItem => {
            return JSON.stringify(oldItem.query) === JSON.stringify(item.query);
          });
        });
        console.log(removedFilters)
      }

      //if oldFilters length is the same as the current filters length, updated a filter?
    }
    this.setState({ oldFilters: this.state.filterManager.filters });
  }

  removeAgentsFilter() {
    this.props.buildOverview();
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
    console.log('filters unsuscribed');
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
    this.closeAgentModal();
    if (agentsIdList) {
      this.props.setAgent(agentsIdList);
      this.setState({ isAgent: true });
    }
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
              <EuiModalHeaderTitle>Select an agent</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <AgentSelectionTable
                updateAgentSearch={agentsIdList => this.updateAgentSearch(agentsIdList)}
              ></AgentSelectionTable>
            </EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      );
    }
    return (
      <div>
        <EuiFlexItem>
          <EuiKeyPadMenu className="VisualizeTopMenu">
            {!this.state.isAgent && (
              <EuiKeyPadMenuItem label="Agent" onClick={() => this.showAgentModal()}>
                <EuiIcon type="watchesApp" color="primary" size="m" />
              </EuiKeyPadMenuItem>
            )}
            {this.state.isAgent && (
              <div className="TopMenuAgent">
                <EuiKeyPadMenuItem
                  label="Change Agent"
                  onClick={() => this.showAgentModal()}
                  betaBadgeLabel="Change"
                  betaBadgeTooltipContent={`Change Agent ${this.state.isAgent}`}
                  betaBadgeIconType="merge"
                >
                  <EuiIcon type="watchesApp" color="primary" size="m" />
                </EuiKeyPadMenuItem>
                <EuiKeyPadMenuItem
                  label="Remove Agent"
                  onClick={() => {
                    this.removeAgentsFilter();
                    this.props.setAgent(false);
                    this.setState({ isAgent: false });
                  }}
                  betaBadgeLabel="Remove"
                  betaBadgeTooltipContent={`Remove Agent ${this.state.isAgent}`}
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
