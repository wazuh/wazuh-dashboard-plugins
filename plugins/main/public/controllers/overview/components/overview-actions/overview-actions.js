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
  showExploreAgentModalGlobal,
  updateCurrentAgentData,
} from '../../../../redux/actions/appStateActions';
import { WzButton } from '../../../../components/common/buttons';
import './agents-selector.scss';
import { AppState } from '../../../../react-services/app-state';
import { getDataPlugin, getWazuhCorePlugin } from '../../../../kibana-services';

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
    const currentAppliedFilters = this.state.filterManager.filters;
    const agentFilters = currentAppliedFilters.filter(x => {
      return x.meta.key !== 'agent.id';
    });
    this.state.filterManager.setFilters(agentFilters);
  }

  componentDidMount() {
    const { filterManager } = getDataPlugin().query;

    this.setState({ filterManager: filterManager }, () => {
      if (this.props.initialFilter)
        this.agentTableSearch([this.props.initialFilter]);
      if (this.props.agent.id) this.agentTableSearch([this.props.agent.id]);
    });
  }

  componentDidUpdate(prevProps) {
    if (this.state.isAgent && !this.props.agent.id) {
      this.setState({ isAgent: false });
    } else if (
      this.props.agent.id &&
      this.state.isAgent !== this.props.agent.id
    ) {
      this.setState({ isAgent: this.props.agent.id });
    }

    // This is added to change the selected agent that is in the overview.js controller,
    // relying on the agent that is in redux.

    if (this.props.agent.id !== prevProps.agent.id) {
      this.props.setAgent(this.props.agent.id ? [this.props.agent.id] : false);
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
    this.props.showExploreAgentModalGlobal(false);
  }

  agentTableSearch(agentIdList) {
    if (agentIdList && agentIdList.length) {
      if (agentIdList.length === 1) {
        const currentAppliedFilters = this.state.filterManager.filters;
        const agentFilters = currentAppliedFilters.filter(x => {
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
            index:
              AppState.getCurrentPattern() ||
              getWazuhCorePlugin().configuration.getSettingValue('pattern'),
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

  render() {
    const thereAgentSelected = (this.props.agent || {}).id;

    const avaliableForAgent =
      this.props.module.availableFor &&
      this.props.module.availableFor.includes('agent');

    let buttonUnpinAgent, buttonExploreAgent;
    if (thereAgentSelected) {
      buttonUnpinAgent = (
        <WzButton
          buttonType='icon'
          className='wz-unpin-agent'
          iconType='pinFilled'
          onClick={() => {
            this.props.updateCurrentAgentData({});
            this.removeAgentsFilter();
          }}
          tooltip={{ position: 'bottom', content: 'Unpin agent' }}
          aria-label='Unpin agent'
        />
      );
    }

    buttonExploreAgent = (
      <WzButton
        buttonType='empty'
        isLoading={this.state.loadingReport}
        color='primary'
        isDisabled={!avaliableForAgent}
        tooltip={{
          position: 'bottom',
          content: !avaliableForAgent
            ? 'This module is not supported for agents.'
            : thereAgentSelected
            ? 'Change agent selected'
            : 'Select an agent to explore its modules',
        }}
        style={
          thereAgentSelected
            ? { background: 'rgba(0, 107, 180, 0.1)' }
            : undefined
        }
        iconType='watchesApp'
        onClick={() => this.props.showExploreAgentModalGlobal(true)}
      >
        {thereAgentSelected
          ? `${this.props.agent.name} (${this.props.agent.id})`
          : 'Explore agent'}
      </WzButton>
    );

    return (
      <div style={{ display: 'inline-flex' }}>
        {buttonExploreAgent}
        {thereAgentSelected && buttonUnpinAgent}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
    agent: state.appStateReducers.currentAgentData,
  };
};

const mapDispatchToProps = dispatch => ({
  updateCurrentAgentData: agent => dispatch(updateCurrentAgentData(agent)),
  showExploreAgentModalGlobal: data =>
    dispatch(showExploreAgentModalGlobal(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(OverviewActions);
