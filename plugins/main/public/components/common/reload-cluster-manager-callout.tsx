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
import { updateWazuhNotReadyYet } from '../../redux/actions/appStateActions';
import {
  clusterReq,
  reloadClusterRuleset,
} from '../../controllers/management/components/management/configuration/utils/wz-fetch';
import { connect } from 'react-redux';

interface IWzReloadClusterManagerCalloutProps {
  updateWazuhNotReadyYet: (wazuhNotReadyYet) => void;
  onReloaded: () => void;
  onReloadedError: () => void;
}

interface IWzReloadClusterManagerCalloutState {
  warningReloading: boolean;
  warningReloadModalVisible: boolean;
  isCluster: boolean;
}

class WzReloadClusterManagerCallout extends Component<
  IWzReloadClusterManagerCalloutProps,
  IWzReloadClusterManagerCalloutState
> {
  constructor(props) {
    super(props);
    this.state = {
      warningReloading: false,
      warningReloadModalVisible: false,
      isCluster: false,
    };
  }
  toggleWarningReloadModalVisible() {
    this.setState({
      warningReloadModalVisible: !this.state.warningReloadModalVisible,
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
  reloadCluster = async () => {
    try {
      this.setState({
        warningReloading: true,
        warningReloadModalVisible: false,
      });
      getToasts().add({
        color: 'success',
        title:
          'Reloading ruleset across the cluster. This may take a few seconds.',
        toastLifeTimeMs: 5000,
      });
      const { data, message } = await reloadClusterRuleset();

      const nodesReloaded = data.affected_items.filter(
        node => !data.failed_items?.includes(node),
      );

      if (nodesReloaded.length) {
        this.props.onReloaded();
        this.showToast(
          'success',
          'Cluster reloaded:',
          nodesReloaded.join(', '),
          15000,
        );
      }
      if (data.total_failed_items > 0) {
        const nodesFailed = data.failed_items.map(node => node.id);
        this.showToast(
          'danger',
          'Nodes failed: ',
          nodesFailed.join(', '),
          15000,
        );
      }
      if (data.total_failed_items === 0) {
        this.props.onReloaded();
        throw new Error(`Failed to reload ruleset: ${message}`);
      }
    } catch (error) {
      this.setState({ warningReloading: false });
      this.props.updateWazuhNotReadyYet(false);
      this.props.onReloadedError();
      this.showToast('danger', 'Error', error?.data?.detail || error);
    }
  };
  async componentDidMount() {
    try {
      const clusterStatus = await clusterReq();
      this.setState({
        isCluster:
          clusterStatus.data.data.enabled === 'yes' &&
          clusterStatus.data.data.running === 'yes',
      });
    } catch (error) {}
  }
  render() {
    const { warningReloading, warningReloadModalVisible } = this.state;
    return (
      <Fragment>
        {!warningReloading && (
          <EuiCallOut>
            <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
              <EuiFlexItem style={{ marginTop: '0', marginBottom: '0' }}>
                <EuiText style={{ color: 'rgb(0, 107, 180)' }}>
                  <EuiIcon
                    type='iInCircle'
                    color='primary'
                    style={{ marginBottom: '7px', marginRight: '6px' }}
                  />
                  <span>
                    Changes will not take effect until a reload is performed.
                  </span>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem
                grow={false}
                style={{ marginTop: '0', marginBottom: '0' }}
              >
                <EuiButton
                  iconType='refresh'
                  onClick={() => this.toggleWarningReloadModalVisible()}
                >
                  {'Reload'}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiCallOut>
        )}
        {warningReloadModalVisible && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`${
                this.state.isCluster ? 'Cluster' : 'Manager'
              } will be restarted`}
              onCancel={() => this.toggleWarningReloadModalVisible()}
              onConfirm={() => this.reloadCluster()}
              cancelButtonText='Cancel'
              confirmButtonText='Confirm'
              defaultFocusedButton='cancel'
            ></EuiConfirmModal>
          </EuiOverlayMask>
        )}
      </Fragment>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateWazuhNotReadyYet: wazuhNotReadyYet =>
      dispatch(updateWazuhNotReadyYet(wazuhNotReadyYet)),
  };
};

export default connect(null, mapDispatchToProps)(WzReloadClusterManagerCallout);
