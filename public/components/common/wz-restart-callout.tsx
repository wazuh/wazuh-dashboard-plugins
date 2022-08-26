/*
 * Wazuh app - React component for registering agents.
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

// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiText,
  EuiIcon,
} from '@elastic/eui';

import { getToasts } from '../../kibana-services';
import {
  updateRestartAttempt,
  updateSyncCheckAttempt,
  updateUnsynchronizedNodes,
  updateRestartStatus,
  updateSyncNodesInfo,
} from '../../redux/actions/restartActions';
import { RestartHandler } from '../../react-services/wz-restart';
import { connect } from 'react-redux';
import { RestartModal } from './restart-modal/restart-modal';

interface IWzRestartCalloutProps {
  updateRestartAttempt: (restartAttempt) => void;
  updateSyncCheckAttempt: (syncCheckAttempt) => void;
  updateUnsynchronizedNodes: (unsynchronizedNodes) => void;
  updateRestartStatus: (restartStatus) => void;
  updateSyncNodesInfo: (syncNodesInfo) => void;
  onRestarted: () => void;
  onRestartedError: () => void;
  restartStatus: string;
}

interface IWzRestartCalloutState {
  warningRestarting: boolean;
  warningRestartModalVisible: boolean;
  isCluster: boolean;
  isRestarting: boolean;
  timeoutRestarting: boolean;
}

class WzRestartCallout extends Component<IWzRestartCalloutProps, IWzRestartCalloutState> {
  isSyncCanceled: { isSyncCanceled: boolean };
  constructor(props) {
    super(props);
    this.state = {
      warningRestarting: false,
      warningRestartModalVisible: false,
      isCluster: false,
      isRestarting: false,
      timeoutRestarting: false,
    };
    this.isSyncCanceled = { isSyncCanceled: false };
  }
  toggleWarningRestartModalVisible() {
    this.setState({
      warningRestartModalVisible: !this.state.warningRestartModalVisible,
      isRestarting: false,
    });
  }
  showToast(color, title, text = '', time = 3000) {
    getToasts().add({
      color,
      title,
      text,
      toastLifeTimeMs: time,
    });
  }
  restartWazuh = async () => {
    try {
      this.setState({
        warningRestarting: true,
        warningRestartModalVisible: false,
        isRestarting: true,
        timeoutRestarting: true,
      });
      const updateRedux = {
        updateRestartAttempt: this.props.updateRestartAttempt,
        updateSyncCheckAttempt: this.props.updateSyncCheckAttempt,
        updateUnsynchronizedNodes: this.props.updateUnsynchronizedNodes,
        updateRestartStatus: this.props.updateRestartStatus,
        updateSyncNodesInfo: this.props.updateSyncNodesInfo,
      };
      await RestartHandler.restartWazuh(updateRedux, this.state.isCluster, this.isSyncCanceled);
      this.setState({ isRestarting: false });
    } catch (error) {
      this.setState({ warningRestarting: false, isRestarting: false });
      this.props.onRestartedError();
      this.showToast('danger', 'Error', error.message || error);
    }
  };
  async componentDidMount() {
    try {
      const clusterStatus = await RestartHandler.clusterReq();
      this.setState({
        isCluster:
          clusterStatus.data.data.enabled === 'yes' && clusterStatus.data.data.running === 'yes',
      });
    } catch (error) {}
  }
  render() {
    const {
      warningRestarting,
      warningRestartModalVisible,
      isCluster,
      timeoutRestarting,
    } = this.state;
    return (
      <Fragment>
        {!warningRestarting && (
          <EuiCallOut>
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
              <EuiFlexItem style={{ marginTop: '0', marginBottom: '0' }}>
                <EuiText style={{ color: 'rgb(0, 107, 180)' }}>
                  <EuiIcon
                    type="iInCircle"
                    color="primary"
                    style={{ marginBottom: '7px', marginRight: '6px' }}
                  />
                  <span>Changes will not take effect until a restart is performed.</span>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: '0', marginBottom: '0' }}>
                <EuiButton
                  iconType="refresh"
                  onClick={() => this.toggleWarningRestartModalVisible()}
                >
                  {'Restart'}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiCallOut>
        )}
        {warningRestartModalVisible && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`${isCluster ? 'Cluster' : 'Manager'} will be restarted`}
              onCancel={() => this.toggleWarningRestartModalVisible()}
              onConfirm={() => {
                isCluster
                  ? this.props.updateRestartStatus(RestartHandler.RESTART_STATES.SYNCING)
                  : this.props.updateRestartStatus(RestartHandler.RESTART_STATES.RESTARTING);
                this.restartWazuh();
              }}
              cancelButtonText="Cancel"
              confirmButtonText="Confirm"
              defaultFocusedButton="cancel"
            ></EuiConfirmModal>
          </EuiOverlayMask>
        )}
        {timeoutRestarting &&
          this.props.restartStatus !== RestartHandler.RESTART_STATES.RESTARTED && (
            <RestartModal
              useDelay={isCluster}
              showWarningRestart={() => this.props.onRestarted()}
              isSyncCanceled={this.isSyncCanceled}
              cancelSync={() => (this.isSyncCanceled.isSyncCanceled = true)}
            />
          )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  restartStatus: state.restartWazuhReducers.restartStatus,
});

const mapDispatchToProps = (dispatch) => {
  return {
    updateRestartAttempt: (restartAttempt) => dispatch(updateRestartAttempt(restartAttempt)),
    updateSyncCheckAttempt: (syncCheckAttempt) =>
      dispatch(updateSyncCheckAttempt(syncCheckAttempt)),
    updateUnsynchronizedNodes: (unsynchronizedNodes) =>
      dispatch(updateUnsynchronizedNodes(unsynchronizedNodes)),
    updateRestartStatus: (restartStatus) => dispatch(updateRestartStatus(restartStatus)),
    updateSyncNodesInfo: (syncNodesInfo) => dispatch(updateSyncNodesInfo(syncNodesInfo)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRestartCallout);
