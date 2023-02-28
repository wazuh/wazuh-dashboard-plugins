/*
 * Wazuh app - React component for show Edit configuration.
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
import PropTypes from 'prop-types';

import {
  EuiButton,
  EuiIcon,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
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
  updateClusterNodeSelected,
} from '../../../../../../redux/actions/configurationActions';
import {
  fetchFile,
  restartNodeSelected,
  saveFileManager,
  saveFileCluster,
  clusterNodes,
  clusterReq,
} from '../utils/wz-fetch';
import { validateXML } from '../utils/xml';
import { getToasts } from '../../../../../..//kibana-services';

import { connect } from 'react-redux';
import { compose } from 'redux';

import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

class WzEditConfiguration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      xml: '',
      editorValue: '',
      initialValue: '',
      restart: false,
      restarting: false,
      saving: false,
      hasChanges: false,
      infoChangesAfterRestart: false,
      disableSaveRestartButtons: false,
    };
  }

  addToast(toast) {
    getToasts().add(toast);
  }
  async editorSave() {
    try {
      this.setState({ saving: true });
      this.props.clusterNodeSelected
        ? await saveFileCluster(this.state.editorValue, this.props.clusterNodeSelected)
        : await saveFileManager(this.state.editorValue);
      this.setState({ saving: false, infoChangesAfterRestart: true, hasChanges: false });
      this.addToast({
        title: (
          <Fragment>
            <EuiIcon type="check" />
            &nbsp;
            <span>
              <b>{this.props.clusterNodeSelected || 'Manager'}</b> configuration has been updated
            </span>
          </Fragment>
        ),
        color: 'success',
      });
    } catch (error) {
      let errorMessage;
      if (error instanceof Error) {
        errorMessage = error.details
          ? `Configuration saved, but some validation errors were found.\n${error.details}`
          : String(error);
      }
      this.setState({ saving: false, infoChangesAfterRestart: false });
      const options = {
        context: `${WzEditConfiguration.name}.editorSave`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: errorMessage || error,
          title: "Error found saving the file.",
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }
  editorCancel() {
    this.props.updateConfigurationSection('');
  }
  refresh() {
    try {
      this.checkIfClusterOrManager();
    } catch (error) {
      const options = {
        context: `${WzEditConfiguration.name}.refresh`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }
  toggleRestart() {
    this.setState({ restart: !this.state.restart });
  }
  onChange(editorValue) {
    this.setState({ editorValue });
  }
  onDidMount(xmlFetched, errorXMLFetched) {
    this.setState({
      editorValue: xmlFetched,
      disableSaveRestartButtons: errorXMLFetched,
      initialValue: xmlFetched,
    });
  }
  onLoadingConfiguration(disableSaveRestartButtons) {
    this.setState({ disableSaveRestartButtons });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.editorValue !== this.state.editorValue) {
      this.setState({ hasChanges: this.state.editorValue !== this.state.initialValue });
    }
  }

  async confirmRestart() {
    try {
      this.setState({ restarting: true, saving: true, infoChangesAfterRestart: false });
      await restartNodeSelected(this.props.clusterNodeSelected, this.props.updateWazuhNotReadyYet);
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
                Nodes could take some time to restart, it may be necessary to perform a refresh to
                see them all.
              </span>
            </Fragment>
          ),
          color: 'success',
        });
      }
      if(!this.props.clusterNodeSelected){
        this.addToast({
          title: 'Manager was restarted',
          color: 'success',
        });
      }
    } catch (error) {
      this.props.updateWazuhNotReadyYet('');
      this.setState({ restart: false, saving: false, restarting: false });
      const options = {
        context: `${WzEditConfiguration.name}.confirmRestart`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async checkIfClusterOrManager() {
    try {
      // in case which enable/disable cluster configuration, update Redux Store
      const clusterStatus = await clusterReq();
      if (clusterStatus.data.data.enabled === 'yes' && clusterStatus.data.data.running === 'yes') {
        // try if it is a cluster
        const nodes = await clusterNodes();
        // set cluster nodes in Redux Store
        this.props.updateClusterNodes(nodes.data.data.affected_items);
        // set cluster node selected in Redux Store
        const existsClusterCurrentNodeSelected = nodes.data.data.affected_items.find(
          (node) => node.name === this.props.clusterNodeSelected
        );
        this.props.updateClusterNodeSelected(
          existsClusterCurrentNodeSelected
            ? existsClusterCurrentNodeSelected.name
            : nodes.data.data.affected_items.find((node) => node.type === 'master').name
        );
        this.props.updateConfigurationSection('edit-configuration', 'Cluster configuration');
      } else {
        // do nothing if it isn't a cluster
        this.props.updateClusterNodes(false);
        this.props.updateClusterNodeSelected(false);
        this.props.updateConfigurationSection('edit-configuration', 'Manager configuration');
      }
    } catch (error) {
      // do nothing if it isn't a cluster
      this.props.updateClusterNodes(false);
      this.props.updateClusterNodeSelected(false);
      this.props.updateConfigurationSection('edit-configuration', 'Manager configuration');
      throw error;
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
          hasChanges={this.state.hasChanges}
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
                permissions={[
                  this.props.clusterNodeSelected
                    ? {
                        action: 'cluster:update_config',
                        resource: `node:id:${this.props.clusterNodeSelected}`,
                      }
                    : { action: 'manager:update_config', resource: '*:*:*' },
                ]}
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
              permissions={[
                this.props.clusterNodeSelected
                  ? {
                      action: 'cluster:restart',
                      resource: `node:id:${this.props.clusterNodeSelected}`,
                    }
                  : { action: 'manager:restart', resource: '*:*:*' },
              ]}
              fill
              iconType="refresh"
              onClick={() => this.toggleRestart()}
              isDisabled={disableSaveRestartButtons || restarting}
              isLoading={restarting}
            >
              {restarting ? 'Restarting' : 'Restart'} {clusterNodeSelected || 'Manager'}
            </WzButtonPermissions>
          </EuiFlexItem>
        </WzConfigurationPath>
        <WzEditorConfiguration
          onChange={(value) => this.onChange(value)}
          onDidMount={(xmlFetched, errorXMLFetched) => this.onDidMount(xmlFetched, errorXMLFetched)}
          toggleRestart={() => this.toggleRestart()}
          confirmRestart={() => this.confirmRestart()}
          onLoadingConfiguration={(value) => this.onLoadingConfiguration(value)}
          {...this.state}
          agent={agent}
          xmlError={xmlError}
        />
        {restart && !restarting && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`${clusterNodeSelected || 'Manager'} will be restarted`}
              onCancel={() => this.toggleRestart()}
              onConfirm={() => this.confirmRestart()}
              cancelButtonText="Cancel"
              confirmButtonText="Confirm"
              defaultFocusedButton="cancel"
            />
          </EuiOverlayMask>
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
});

const mapDispatchToProps = (dispatch) => ({
  updateClusterNodes: (clusterNodes) => dispatch(updateClusterNodes(clusterNodes)),
  updateClusterNodeSelected: (clusterNodeSelected) =>
    dispatch(updateClusterNodeSelected(clusterNodeSelected)),
  updateWazuhNotReadyYet: (value) => dispatch(updateWazuhNotReadyYet(value)),
});

WzEditConfiguration.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  updateWazuhNotReadyYet: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(WzEditConfiguration);

const mapStateToPropsEditor = (state) => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  clusterNodes: state.configurationReducers.clusterNodes,
  refreshTime: state.configurationReducers.refreshTime,
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

const WzEditorConfiguration = compose(
  connect(mapStateToPropsEditor),
  withLoading(
    async (props) => {
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
    (props, prevProps) =>
      (props.agent.id === '000' &&
        props.clusterNodeSelected &&
        prevProps.clusterNodeSelected &&
        props.clusterNodeSelected !== prevProps.clusterNodeSelected) ||
      props.refreshTime !== prevProps.refreshTime
  )
)(
  // eslint-disable-next-line react/no-multi-comp
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
        wazuhNotReadyYet,
      } = this.props;
      const existsClusterCurrentNodeSelected =
        this.props.clusterNodes &&
        this.props.clusterNodes.find((node) => node.name === this.props.clusterNodeSelected);
      return (
        <Fragment>
          {!this.props.errorXMLFetched ? (
            <Fragment>
              <EuiText>
                Edit <span style={{ fontWeight: 'bold' }}>ossec.conf</span> of{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {(existsClusterCurrentNodeSelected && clusterNodeSelected) || 'Manager'}
                  {existsClusterCurrentNodeSelected && clusterNodeSelected && clusterNodes
                    ? ' (' +
                      clusterNodes.find((node) => node.name === clusterNodeSelected).type +
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
                  onChange={(value) => onChange(value)}
                  minusHeight={wazuhNotReadyYet || infoChangesAfterRestart ? 320 : 270}
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
