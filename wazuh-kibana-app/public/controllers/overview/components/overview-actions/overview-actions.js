/*
 * Wazuh app - React component for Overview actions.
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
import { connect } from 'react-redux';
import {
  showExploreAgentModal,
  updateCurrentAgentData,
} from '../../../../redux/actions/appStateActions';
import {
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPopover,
} from '@elastic/eui';
import { WzButton } from '../../../../components/common/buttons';
import './agents-selector.scss';
import { AgentSelectionTable } from './agents-selection-table';
import { AppState } from '../../../../react-services/app-state';
import { getDataPlugin } from '../../../../kibana-services';
import { getSettingDefaultValue } from '../../../../../common/services/settings';

class OverviewActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: this.props.tab || '',
      subtab: this.props.subtab || '',
      isAgentModalVisible: false,
    };
  }

  async removeAgentsFilter(shouldUpdate = true) {
    await this.props.setAgent(false);
    const currentAppliedFilters = this.state.filterManager.filters;
    const agentFilters = currentAppliedFilters.filter((x) => {
      return x.meta.key !== 'agent.id';
    });
    this.state.filterManager.setFilters(agentFilters);
  }

  componentDidMount() {
    const { filterManager } = getDataPlugin().query;

    this.setState({ filterManager: filterManager }, () => {
      if (this.props.initialFilter) this.agentTableSearch([this.props.initialFilter]);
      if (this.props.agent.id) this.agentTableSearch([this.props.agent.id]);
    });
  }

  componentDidUpdate() {
    if (this.state.isAgent && !this.props.agent.id) {
      this.setState({ isAgent: false });
    } else if (this.props.agent.id && this.state.isAgent !== this.props.agent.id) {
      this.setState({ isAgent: this.props.agent.id });
    }
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
    this.props.showExploreAgentModal(false);
  }

  showAgentModal() {
    this.setState({ isAgentModalVisible: true });
  }

  updateAgentSearch(agentsIdList) {
    if (agentsIdList) {
      this.setState({ isAgent: agentsIdList });
    }
  }

  agentTableSearch(agentIdList) {
    if (agentIdList && agentIdList.length) {
      if (agentIdList.length === 1) {
        const currentAppliedFilters = this.state.filterManager.filters;
        const agentFilters = currentAppliedFilters.filter((x) => {
          return x.meta.key !== 'agent.id';
        });
        const filter = {
          meta: {
            alias: null,
            disabled: false,
            key: 'agent.id',
            negate: false,
            params: { query: agentIdList[0] },
            type: 'phrase',
            index: AppState.getCurrentPattern() || getSettingDefaultValue('pattern'),
          },
          query: {
            match: {
              'agent.id': {
                query: agentIdList[0],
                type: 'phrase',
              },
            },
          },
          $state: { store: 'appState', isImplicit: true },
        };
        agentFilters.push(filter);
        this.state.filterManager.setFilters(agentFilters);
        this.props.setAgent(agentIdList);
      }
    }

    this.setState({ isAgent: agentIdList }, () => this.closeAgentModal());
  }

  getSelectedAgents() {
    let selectedAgentsObject = {};
    for (
      var i = 0;
      this.state.isAgent && this.state.isAgent.length && i < this.state.isAgent.length;
      ++i
    )
      selectedAgentsObject[this.state.isAgent[i]] = true;
    return selectedAgentsObject;
  }

  render() {
    let modal;

    if (this.state.isAgentModalVisible || this.props.state.showExploreAgentModal) {
      modal = (
        <EuiOverlayMask>
          <EuiOutsideClickDetector onOutsideClick={() => this.closeAgentModal()}>
            <EuiModal
              className="wz-select-agent-modal"
              onClose={() => this.closeAgentModal()}
              initialFocus="[name=popswitch]"
            >
              <EuiModalHeader>
                <EuiModalHeaderTitle>Explore agent</EuiModalHeaderTitle>
              </EuiModalHeader>

              <EuiModalBody>
                <AgentSelectionTable
                  updateAgentSearch={(agentsIdList) => this.agentTableSearch(agentsIdList)}
                  removeAgentsFilter={(shouldUpdate) => this.removeAgentsFilter(shouldUpdate)}
                  selectedAgents={this.getSelectedAgents()}
                ></AgentSelectionTable>
              </EuiModalBody>
            </EuiModal>
          </EuiOutsideClickDetector>
        </EuiOverlayMask>
      );
    }

    const thereAgentSelected = (this.props.agent || {}).id;

    const avaliableForAgent =
      this.props.module.availableFor && this.props.module.availableFor.includes('agent');

    let buttonUnpinAgent, buttonExploreAgent;
    if (thereAgentSelected) {
      buttonUnpinAgent = (
        <WzButton
          buttonType="icon"
          className="wz-unpin-agent"
          iconType="pinFilled"
          onClick={() => {
            this.props.updateCurrentAgentData({});
            this.removeAgentsFilter();
          }}
          tooltip={{ position: 'bottom', content: 'Unpin agent' }}
          aria-label="Unpin agent"
        />
      );
    }

    buttonExploreAgent = (
      <WzButton
        buttonType="empty"
        isLoading={this.state.loadingReport}
        color="primary"
        isDisabled={!avaliableForAgent}
        tooltip={{
          position: 'bottom',
          content: !avaliableForAgent
            ? 'This module is not supported for agents.'
            : thereAgentSelected
            ? 'Change agent selected'
            : 'Select an agent to explore its modules',
        }}
        style={thereAgentSelected ? { background: 'rgba(0, 107, 180, 0.1)' } : undefined}
        iconType="watchesApp"
        onClick={() => this.showAgentModal()}
      >
        {thereAgentSelected ? `${this.props.agent.name} (${this.props.agent.id})` : 'Explore agent'}
      </WzButton>
    );

    return (
      <div style={{ display: 'inline-flex' }}>
        {buttonExploreAgent}
        {thereAgentSelected && buttonUnpinAgent}
        {modal}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.appStateReducers,
    agent: state.appStateReducers.currentAgentData,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateCurrentAgentData: (agent) => dispatch(updateCurrentAgentData(agent)),
  showExploreAgentModal: (data) => dispatch(showExploreAgentModal(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(OverviewActions);
