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
import React from 'react';
import {
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { connect } from 'react-redux';
import { showExploreAgentModalGlobal } from '../../redux/actions/appStateActions';
import store from '../../redux/store';
import { AgentSelectionTable } from '../../controllers/overview/components/overview-actions/agents-selection-table';

const WzAgentSelector = props => {
  const closeAgentModal = () => {
    store.dispatch(showExploreAgentModalGlobal(false));
  };
  return props.state.showExploreAgentModalGlobal ? (
    <EuiOverlayMask>
      <EuiOutsideClickDetector onOutsideClick={() => closeAgentModal()}>
        <EuiModal
          className='wz-select-agent-modal'
          onClose={() => closeAgentModal()}
          initialFocus='[name=popswitch]'
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>Explore agent</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <AgentSelectionTable closeAgentModal={closeAgentModal} />
          </EuiModalBody>
        </EuiModal>
      </EuiOutsideClickDetector>
    </EuiOverlayMask>
  ) : null;
};

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(mapStateToProps, null)(WzAgentSelector);
