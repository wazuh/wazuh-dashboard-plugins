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
  EuiIcon
} from '@elastic/eui';

import { getToasts }  from '../../kibana-services';
import { updateRestartWazuhTries } from '../../redux/actions/appStateActions';
import { RestartHandler } from '../../react-services/wz-restart';
import { connect } from 'react-redux';
import { RestartModal } from './restart-modal/restart-modal';

interface IWzRestartClusterManagerCalloutProps{
  updateRestartWazuhTries: (wazuhNotReadyYet) => void
  onRestarted: () => void
  onRestartedError: () => void
};

interface IWzRestartClusterManagerCalloutState{
  warningRestarting: boolean
  warningRestartModalVisible: boolean
  isCluster: boolean
  isRestarting: boolean
  timeoutRestarting: boolean
};

class WzRestartClusterManagerCallout extends Component<IWzRestartClusterManagerCalloutProps, IWzRestartClusterManagerCalloutState>{
  constructor(props){
    super(props);
    this.state = {
      warningRestarting: false,
      warningRestartModalVisible: false,
      isCluster: false,
      isRestarting: false,
      timeoutRestarting: false,
    };
  }
  toggleWarningRestartModalVisible(){
    this.setState({ warningRestartModalVisible: !this.state.warningRestartModalVisible, isRestarting: false })
  }
  showToast(color, title, text = '', time = 3000){
    getToasts().add({
      color,
      title,
      text,
      toastLifeTimeMs: time
    });
  }
  restartWazuh = async () => {
    try{
      this.setState({ warningRestarting: true, warningRestartModalVisible: false, isRestarting: true, timeoutRestarting:true });
      await RestartHandler.restartWazuh(this.props.updateRestartWazuhTries, this.state.isCluster);
      this.setState({ isRestarting: false, timeoutRestarting:false });
      this.props.onRestarted();
    }catch(error){
      this.setState({ warningRestarting: false, isRestarting: false });
      this.props.updateRestartWazuhTries(0);
      this.props.onRestartedError();
      this.showToast('danger', 'Error', error.message || error );
    }
  };
  async componentDidMount(){
    try{
      const clusterStatus = await RestartHandler.clusterReq();
      this.setState( { isCluster: clusterStatus.data.data.enabled === 'yes' && clusterStatus.data.data.running === 'yes' });
    }catch(error){}
  }
  render(){
    const { warningRestarting, warningRestartModalVisible, isRestarting, isCluster, timeoutRestarting } = this.state;
    return (
      <Fragment>
        {!warningRestarting && (
          <EuiCallOut>
            <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
              <EuiFlexItem style={{ marginTop: '0', marginBottom: '0'}}>
                <EuiText style={{color: 'rgb(0, 107, 180)'}} >
                  <EuiIcon type='iInCircle' color='primary' style={{marginBottom: '7px', marginRight: '6px'}}/>
                  <span>Changes will not take effect until a restart is performed.</span>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ marginTop: '0', marginBottom: '0'}}>
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
              onConfirm={() => this.restartWazuh()}
              cancelButtonText="Cancel"cluster
              confirmButtonText="Confirm"
              defaultFocusedButton="cancel"
            ></EuiConfirmModal>
          </EuiOverlayMask>
        )}
        { timeoutRestarting && (
          <RestartModal isRestarting={isRestarting} needDelay={isCluster} />
        )}
      </Fragment>
      )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateRestartWazuhTries: restartWazuhTries => dispatch(updateRestartWazuhTries(restartWazuhTries))
  }
};

export default connect(null, mapDispatchToProps)(WzRestartClusterManagerCallout)