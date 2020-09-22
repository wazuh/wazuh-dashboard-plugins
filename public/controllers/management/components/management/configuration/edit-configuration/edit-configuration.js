/*
 * Wazuh app - React component for show Edit configuration.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import {
  EuiButton,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiCallOut,
} from '@elastic/eui';

import WzCodeEditor from '../util-components/code-editor';
import WzWazuhAPINotReachable from '../util-components/wz-api-not-reachable';
import WzConfigurationPath from '../util-components/configuration-path';
import WzRefreshClusterInfoButton from '../util-components/refresh-cluster-info-button';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';
import withLoading from '../util-hocs/loading';
import { updateWazuhNotReadyYet } from '../../../../../../redux/actions/appStateActions';
import {
  updateClusterNodes,
  updateClusterNodeSelected
} from '../../../../../../redux/actions/configurationActions';
import {
  fetchFile,
  restartNodeSelected,
  saveFileManager,
  saveFileCluster,
  clusterNodes,
  clusterReq
} from '../utils/wz-fetch';
import { validateXML } from '../utils/xml';
import { toastNotifications } from 'ui/notify';

import { connect } from 'react-redux';
import { compose } from 'redux';
import { AppState } from '../../../../../../react-services/app-state';
import { ApiCheck } from '../../../../../../react-services/wz-api-check';

class WzEditConfiguration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      xml: '',
      editorValue: '',
      restart: false,
      restarting: false,
      saving: false,
      infoChangesAfterRestart: false,
      disableSaveRestartButtons: false
    };
  }
  addToast(toast){
    toastNotifications.add(toast);
  }
  async editorSave() {
    try {
      this.setState({ saving: true });
      this.props.clusterNodeSelected
        ? await saveFileCluster(
            this.state.editorValue,
            this.props.clusterNodeSelected
          )
        : await saveFileManager(this.state.editorValue);
      this.setState({ saving: false, infoChangesAfterRestart: true });
      this.addToast({
        title: (
          <Fragment>
            <EuiIcon type="check" />
            &nbsp;
            <span>
              <b>{this.props.clusterNodeSelected || 'Manager'}</b> configuration
              has been updated
            </span>
          </Fragment>
        ),
        color: 'success'
      });
    } catch (error) {
      if (error.details) {
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="alert" />
              &nbsp;
              <span>
                File ossec.conf saved, but there were found several error while
                validating the configuration.
              </span>
            </Fragment>
          ),
          color: 'warning',
          text: error.details
        });
      } else {
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="alert" />
              &nbsp;
              <span>Error saving configuration</span>
            </Fragment>
          ),
          color: 'danger',
          text: typeof error === 'string' ? error : error.message
        });
      }
      this.setState({ saving: false, infoChangesAfterRestart: false });
    }
  }
  editorCancel() {
    this.props.updateConfigurationSection('');
  }
  refresh() {
    this.checkIfClusterOrManager();
  }
  toggleRestart() {
    this.setState({ restart: !this.state.restart });
  }
  onChange(editorValue) {
    this.setState({ editorValue });
  }
  onDidMount(xmlFetched, errorXMLFetched) {
    this.setState({ editorValue: xmlFetched, disableSaveRestartButtons: errorXMLFetched});
  }
  onLoadingConfiguration(disableSaveRestartButtons) {
    this.setState({ disableSaveRestartButtons });
  }
  async confirmRestart() {
    try {
      this.setState({ restarting: true, saving: true, infoChangesAfterRestart: false });
      await restartNodeSelected(
        this.props.clusterNodeSelected,
        this.props.updateWazuhNotReadyYet
      );
      this.props.updateWazuhNotReadyYet('');
      this.setState({ restart: false, saving: false, restarting: false });
      await this.checkIfClusterOrManager();
      if (this.props.clusterNodes) {
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="iInCircle" />
              &nbsp;
              <span>
                Nodes could take some time to restart, it may be necessary to
                perform a refresh to see them all.
              </span>
            </Fragment>
          ),
          color: 'success'
        });
      }
    } catch (error) {
      this.props.updateWazuhNotReadyYet('');
      this.setState({ restart: false, saving: false, restarting: false });
    }
  }

  async checkIfClusterOrManager() {
    try {
      // in case which enable/disable cluster configuration, update Redux Store
      const clusterStatus = await clusterReq();
      if(clusterStatus.data.data.enabled === 'yes' && clusterStatus.data.data.running === 'yes'){
        // try if it is a cluster
        const nodes = await clusterNodes();
        // set cluster nodes in Redux Store
        this.props.updateClusterNodes(nodes.data.data.affected_items);
        // set cluster node selected in Redux Store
        const existsClusterCurrentNodeSelected = nodes.data.data.affected_items.find(
          node => node.name === this.props.clusterNodeSelected
        );
        this.props.updateClusterNodeSelected(
          existsClusterCurrentNodeSelected
            ? existsClusterCurrentNodeSelected.name
            : nodes.data.data.affected_items.find(node => node.type === 'master').name
        );
        this.props.updateConfigurationSection(
          'edit-configuration',
          'Cluster configuration'
        );
      }else{
        // do nothing if it isn't a cluster
        this.props.updateClusterNodes(false);
        this.props.updateClusterNodeSelected(false);
        this.props.updateConfigurationSection(
          'edit-configuration',
          'Manager configuration'
        );
      }
    } catch (error) {
      // do nothing if it isn't a cluster
      this.props.updateClusterNodes(false);
      this.props.updateClusterNodeSelected(false);
      this.props.updateConfigurationSection(
        'edit-configuration',
        'Manager configuration'
      );
    }
  }
  render() {
    const { restart, restarting, saving, editorValue, disableSaveRestartButtons } = this.state;
    const { clusterNodeSelected, agent } = this.props;
    const xmlError = editorValue && validateXML(editorValue);
    return (
      <Fragment>
        <WzConfigurationPath
          title={`${clusterNodeSelected ? 'Cluster' : 'Manager'} configuration`}
          updateConfigurationSection={this.props.updateConfigurationSection}
        >
          <EuiFlexItem grow={false}>
            <WzRefreshClusterInfoButton />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {xmlError ? (
              <EuiButton iconType="alert" isDisabled>
                XML format error
              </EuiButton>
            ) : (
              <WzButtonPermissions
                permissions={[this.props.clusterNodeSelected ? {action: 'cluster:upload_file', resource: `node:id:${this.props.clusterNodeSelected}`} : {action: 'manager:upload_file', resource: 'file:path:/etc/ossec.conf'}]}
                isDisabled={saving || disableSaveRestartButtons}
                iconType="save"
                onClick={() => this.editorSave()}
              >
                Save
              </WzButtonPermissions>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <WzButtonPermissions
              permissions={[this.props.clusterNodeSelected ? {action: 'cluster:restart', resource: `node:id:${this.props.clusterNodeSelected}`} : {action: 'manager:restart', resource: '*:*:*'}]}
              fill
              iconType="refresh"
              onClick={() => this.toggleRestart()}
              isDisabled={disableSaveRestartButtons || restarting}
              isLoading={restarting}
            >
              {restarting ? 'Restarting' : 'Restart' } {clusterNodeSelected || 'Manager'}
            </WzButtonPermissions>
          </EuiFlexItem>
        </WzConfigurationPath>
        <WzEditorConfiguration
          onChange={value => this.onChange(value)}
          onDidMount={(xmlFetched, errorXMLFetched) => this.onDidMount(xmlFetched, errorXMLFetched)}
          toggleRestart={() => this.toggleRestart()}
          confirmRestart={() => this.confirmRestart()}
          onLoadingConfiguration={value => this.onLoadingConfiguration(value)}
          {...this.state}
          agent={agent}
          xmlError={xmlError}
        />
        {restart && !restarting && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`${clusterNodeSelected ||
                'Manager'} will be restarted`}
              onCancel={() => this.toggleRestart()}
              onConfirm={() => this.confirmRestart()}
              cancelButtonText="Cancel"
              confirmButtonText="Confirm"
              defaultFocusedButton="cancel"
            ></EuiConfirmModal>
          </EuiOverlayMask>
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected
});

const mapDispatchToProps = dispatch => ({
  updateClusterNodes: clusterNodes =>
    dispatch(updateClusterNodes(clusterNodes)),
  updateClusterNodeSelected: clusterNodeSelected =>
    dispatch(updateClusterNodeSelected(clusterNodeSelected)),
  updateWazuhNotReadyYet: value => dispatch(updateWazuhNotReadyYet(value))
});

WzEditConfiguration.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  updateWazuhNotReadyYet: PropTypes.func
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzEditConfiguration);

const mapStateToPropsEditor = state => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  clusterNodes: state.configurationReducers.clusterNodes,
  refreshTime: state.configurationReducers.refreshTime,
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

const WzEditorConfiguration = compose(
  connect(mapStateToPropsEditor),
  withLoading(async props => {
    try {
      props.onLoadingConfiguration(true);
      const xmlFetched = await fetchFile(props.clusterNodeSelected);
      props.onLoadingConfiguration(false);
      return { xmlFetched };
    } catch (error) {
      props.onLoadingConfiguration(false);
      return { xmlFetched: null, errorXMLFetched: error };
    }
  },
  (props, prevProps) => (props.agent.id === '000' && props.clusterNodeSelected && prevProps.clusterNodeSelected && props.clusterNodeSelected !== prevProps.clusterNodeSelected) || (props.refreshTime !== prevProps.refreshTime)
  )
)(
  class WzEditorConfiguration extends Component {
    constructor(props) {
      super(props);
    }
    componentDidMount() {
      this.props.onDidMount(this.props.xmlFetched, this.props.errorXMLFetched);
    }
    render() {
      const {
        clusterNodes,
        clusterNodeSelected,
        xmlError,
        infoChangesAfterRestart,
        editorValue,
        onChange,
        wazuhNotReadyYet
      } = this.props;
      const existsClusterCurrentNodeSelected =
        this.props.clusterNodes &&
        this.props.clusterNodes.find(
          node => node.name === this.props.clusterNodeSelected
        );
      return (
        <Fragment>
          {!this.props.errorXMLFetched ? (
            <Fragment>
              <EuiText>
                Edit <span style={{ fontWeight: 'bold' }}>ossec.conf</span> of{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {(existsClusterCurrentNodeSelected && clusterNodeSelected) ||
                    'Manager'}
                  {existsClusterCurrentNodeSelected &&
                  clusterNodeSelected &&
                  clusterNodes
                    ? ' (' +
                      clusterNodes.find(
                        node => node.name === clusterNodeSelected
                      ).type +
                      ')'
                    : ''}
                </span>
                {xmlError && <span style={{ color: 'red' }}> {xmlError}</span>}
              </EuiText>
              {infoChangesAfterRestart && (
                <EuiCallOut
                  iconType="iInCircle"
                  title="Changes will not take effect until a restart is performed."
                />
              )}
              <EuiSpacer size="s" />
              {typeof editorValue === 'string' && (
                <WzCodeEditor
                mode="xml"
                value={editorValue}
                onChange={value => onChange(value)}
                minusHeight={
                  wazuhNotReadyYet || infoChangesAfterRestart ? 270 : 220
                }
              />
              )}
              
            </Fragment>
          ) : (
            <WzWazuhAPINotReachable error={this.props.errorXMLFetched} />
          )}
        </Fragment>
      );
    }
  }
);
