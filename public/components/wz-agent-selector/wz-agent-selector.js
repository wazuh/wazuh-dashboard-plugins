/*
 * Wazuh app - React component for build q queries.
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
import {
  EuiButtonEmpty,
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalHeaderTitle
} from '@elastic/eui';
import { connect } from 'react-redux';
import { showExploreAgentModalGlobal } from '../../redux/actions/appStateActions';
import store from '../../redux/store';
import { AgentSelectionTable } from '../../controllers/overview/components/overview-actions/agents-selection-table';
import { getSettingDefaultValue } from '../../../common/services/settings';
import { AppState } from '../../react-services/app-state';
import { getAngularModule, getDataPlugin } from '../../kibana-services';

class WzAgentSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
   
    };
    this.store = store;
  }

  async componentDidMount() {
    const $injector = getAngularModule().$injector;
    this.route = $injector.get('$route');
    this.location = $injector.get('$location');
  }

  closeAgentModal(){
    store.dispatch(showExploreAgentModalGlobal(false));
  }

  agentTableSearch(agentIdList){
    this.closeAgentModal();
    if(window.location.href.includes("/agents?")){
      this.location.search('agent', store.getState().appStateReducers.currentAgentData.id ? String(store.getState().appStateReducers.currentAgentData.id):null);
      this.route.reload();
      return;
    }
    this.location.search('agentId', store.getState().appStateReducers.currentAgentData.id ? String(store.getState().appStateReducers.currentAgentData.id):null);

    const { filterManager } = getDataPlugin().query;
    if (agentIdList && agentIdList.length) {
      if (agentIdList.length === 1) {
        const currentAppliedFilters = filterManager.getFilters();
        const agentFilters = currentAppliedFilters.filter(x => {
          return x.meta.key !== 'agent.id';
        });
        const filter = {
          "meta": {
            "alias": null,
            "disabled": false,
            "key": "agent.id",
            "negate": false,
            "params": { "query": agentIdList[0] },
            "type": "phrase",
            "index": AppState.getCurrentPattern() || getSettingDefaultValue('pattern')
          },
          "query": {
            "match": {
              'agent.id': {
                query: agentIdList[0],
                type: 'phrase'
              }
            }
          },
          "$state": { "store": "appState", "isImplicit": true},
        };
        agentFilters.push(filter);
        filterManager.setFilters(agentFilters);
      }
    }
  }

  removeAgentsFilter(shouldUpdate){
    this.closeAgentModal();
    if(window.location.href.includes("/agents?")){
      window.location.href = "#/agents-preview"
      this.route.reload();
      return;
    }
    const { filterManager } = getServices();
    const currentAppliedFilters = filterManager.filters;
    const agentFilters = currentAppliedFilters.filter(x => {
      return x.meta.key === 'agent.id';
    });
    agentFilters.map(x => {
      filterManager.removeFilter(x);
    });
    this.closeAgentModal();
  }

  getSelectedAgents(){
    const selectedAgents = {};
    const agentId = store.getState().appStateReducers.currentAgentData.id;
    if(agentId)
      selectedAgents[agentId] = true;
    return selectedAgents;
  }

  render() {
    let modal = (<></>);

    if (this.props.state.showExploreAgentModalGlobal) {
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
                  updateAgentSearch={agentsIdList => this.agentTableSearch(agentsIdList)}
                  removeAgentsFilter={(shouldUpdate) => this.removeAgentsFilter(shouldUpdate)}
                  selectedAgents={this.getSelectedAgents()}
                ></AgentSelectionTable>
              </EuiModalBody>
            </EuiModal>
          </EuiOutsideClickDetector>
        </EuiOverlayMask>
      );
    }
    return modal;
  }
}

const mapStateToProps = state => {
  return {
    state: state.appStateReducers
  };
};

export default connect(
  mapStateToProps,
  null
)(WzAgentSelector);
