/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiCallOut,
  EuiTitle,
  EuiProgress
} from "@elastic/eui";

import WzCodeEditor from '../util-components/code-editor';
import WzWazuhAPINotReachable from '../util-components/wz-api-not-reachable';
import WzConfigurationPath from '../util-components/configuration-path';
import withLoading from '../util-hocs/loading';
import WzLoading from '../util-components/loading';
import { withWzToast } from '../util-providers/toast-p';
import { updateWazuhNotReadyYet } from '../../../../../../redux/actions/appStateActions';
import { updateClusterNodes, updateClusterNodeSelected, updateLoadingStatus } from '../../../../../../redux/actions/configurationActions';
import { fetchFile, restartNodeSelected, saveFileManager, saveFileCluster, clusterNodes } from '../utils/wz-fetch';
import { validateXML } from '../utils/xml';

import { connect } from 'react-redux';
import { compose } from 'redux';

class WzEditConfiguration extends Component{
  constructor(props){
    super(props);
    this.state = {
      xml: '',
      editorValue: '',
      xmlError: false,
      restart: false,
      restarting: false,
      saving: false,
      infoChangesAfterRestart: false
    };
  }
  async editorSave(){
    try{
      this.setState({ saving: true });
      this.props.clusterNodeSelected ?
        await saveFileCluster(this.state.editorValue, this.props.clusterNodeSelected)
        : await saveFileManager(this.state.editorValue);
      this.setState({ saving: false, infoChangesAfterRestart: true });
      this.props.addToast({
        title: (
          <Fragment>
            <EuiIcon type='check'/>&nbsp;
            <span><b>{this.props.clusterNodeSelected || 'Manager' }</b> configuration has been updated</span>
          </Fragment>),
        color: 'success'
      });
    }catch(error){
      if(error.details) {
        this.props.addToast({
          title: (
            <Fragment>
              <EuiIcon type='alert'/>&nbsp;
              <span>File ossec.conf saved, but there were found several error while validating the configuration.</span>
            </Fragment>),
          color: 'warning',
          text: error.details
        });
      } else {
        this.props.addToast({
          title: (
            <Fragment>
              <EuiIcon type='alert'/>&nbsp;
              <span>Error saving configuration</span>
            </Fragment>),
          color: 'danger',
          text: typeof error === 'string' ? error : error.message
        });
      }
      this.setState({ saving: false, infoChangesAfterRestart: false });
    }
  }
  editorCancel(){
    this.props.updateConfigurationSection('');
  }
  refresh(){
    this.checkIfClusterOrManager();
  }
  toggleRestart(){
    this.setState({ restart: !this.state.restart }); 
  }
  onChange(editorValue){
    const xmlError = validateXML(editorValue);
    this.setState({ editorValue, xmlError });
  }
  onDidMount(xmlFetched){
    this.setState({ editorValue: xmlFetched })
  }
  async confirmRestart(){
    try{
      this.setState({ restarting: true, infoChangesAfterRestart: false } );
      await restartNodeSelected(this.props.clusterNodeSelected, this.props.updateWazuhNotReadyYet);
      this.props.updateWazuhNotReadyYet('');
      this.setState({ restart: false, restarting: false });
      await this.checkIfClusterOrManager();
      if(this.props.clusterNodes){
        this.props.addToast({
          title: (
            <Fragment>
              <EuiIcon type='iInCircle'/>&nbsp;
              <span>Nodes could take some time to restart, it may be necessary to perform a refresh to see them all.</span>
            </Fragment>),
          color: 'success'
        })
      }
    }catch(error){
      this.props.updateWazuhNotReadyYet('');
      this.setState({ restart: false, restarting: false });
    }
  }
  async checkIfClusterOrManager(){
    try{ // in case which enable/disable cluster configuration, update Redux Store
      // try if it is a cluster
      const nodes = await clusterNodes();
      // set cluster nodes in Redux Store
      this.props.updateClusterNodes(nodes.data.data.items);
      // set cluster node selected in Redux Store
      const existsClusterCurrentNodeSelected = nodes.data.data.items.find(node => node.name === this.props.clusterNodeSelected);
      this.props.updateClusterNodeSelected(existsClusterCurrentNodeSelected ? existsClusterCurrentNodeSelected.name : nodes.data.data.items.find(node => node.type === 'master').name);
      this.props.updateConfigurationSection('edit-configuration', 'Cluster configuration');
      this.props.updateLoadingStatus(true);
      setTimeout(() => this.props.updateLoadingStatus(false),1); // Trick to unmount this component and redo the request to get XML configuration
    }catch(error){
      // do nothing if it isn't a cluster
      this.props.updateClusterNodes(false);
      this.props.updateClusterNodeSelected(false);
      this.props.updateConfigurationSection('edit-configuration', 'Manager configuration');
      this.props.updateLoadingStatus(true);
      setTimeout(() => this.props.updateLoadingStatus(false),1); // Trick to unmount this component and redo the request to get XML configuration
    }
  }
  render(){
    const { xmlError, restart, restarting, saving } = this.state;
    const { clusterNodeSelected, loadingStatus } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title={`${clusterNodeSelected ? 'Cluster' : 'Manager'} configuration`} updateConfigurationSection={this.props.updateConfigurationSection}>
          <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType='refresh' onClick={() => this.refresh()}>Refresh</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {xmlError ? 
              <EuiButton iconType='alert' isDisabled>XML format error</EuiButton>
              : <EuiButton isDisabled={saving} iconType='save' onClick={() => this.editorSave()}>Save</EuiButton>
            }
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {restarting ? 
                <EuiButton fill isDisabled>
                  <EuiLoadingSpinner size="s"/> Restarting {clusterNodeSelected || 'Manager'}
                </EuiButton>
              : <EuiButton fill iconType='refresh' onClick={() => this.toggleRestart()}>Restart {clusterNodeSelected || 'Manager'}</EuiButton>}
          </EuiFlexItem>
        </WzConfigurationPath>
        {!loadingStatus && (
          <Fragment>
            <WzEditorConfiguration
             onChange={(value) => this.onChange(value)}
             onDidMount={(value) => this.onDidMount(value)}
             toggleRestart={() => this.toggleRestart()}
             confirmRestart={() => this.confirmRestart()}
             {...this.state}
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
                ></EuiConfirmModal>
              </EuiOverlayMask>
            )}
          </Fragment>
        ) || (
          <WzLoading />
        )}
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  loadingStatus: state.configurationReducers.loadingStatus
});

const mapDispatchToProps = (dispatch) => ({
  updateClusterNodes: (clusterNodes) => dispatch(updateClusterNodes(clusterNodes)),
	updateClusterNodeSelected: (clusterNodeSelected) => dispatch(updateClusterNodeSelected(clusterNodeSelected)),
  updateWazuhNotReadyYet: (value) => dispatch(updateWazuhNotReadyYet(value)),
  updateLoadingStatus: (loadingStatus) => dispatch(updateLoadingStatus(loadingStatus))
});

WzEditConfiguration.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  updateWazuhNotReadyYet: PropTypes.func
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withWzToast
)(WzEditConfiguration);

const mapStateToPropsEditor = (state) => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  clusterNodes: state.configurationReducers.clusterNodes,
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

const WzEditorConfiguration = compose(
  connect(mapStateToPropsEditor),
  withLoading(async (props) => {
    try{
      const xmlFetched = await fetchFile(props.clusterNodeSelected)
      return { xmlFetched }
    }catch(error){
      return { xmlFetched: null, errorXMLFetched: error }
    }
  })
)(class WzEditorConfiguration extends Component{
  constructor(props){
    super(props);
  }
  componentDidMount(){
    this.props.onDidMount(this.props.xmlFetched);
  }
  render(){
    const { clusterNodes, clusterNodeSelected, xmlError, infoChangesAfterRestart, editorValue,
          onChange, wazuhNotReadyYet
    } = this.props;
    const existsClusterCurrentNodeSelected = this.props.clusterNodes && this.props.clusterNodes.find(node => node.name === this.props.clusterNodeSelected);
    return (
      <Fragment>
        {!this.props.errorXMLFetched ? (
          <Fragment>
            <EuiText>
              Edit <span style={{fontWeight: 'bold'}}>ossec.conf</span> of <span style={{fontWeight: 'bold'}}>{existsClusterCurrentNodeSelected && clusterNodeSelected || 'Manager'}{existsClusterCurrentNodeSelected && clusterNodeSelected && clusterNodes ? ' (' + clusterNodes.find(node => node.name === clusterNodeSelected).type + ')' : ''}</span>
              {xmlError && <span style={{ color: 'red'}}> {xmlError}</span>}
            </EuiText>
            {infoChangesAfterRestart && (
              <EuiCallOut iconType='iInCircle' title='Changes will not take effect until a restart is performed.'/>
            )}
            <EuiSpacer size='s'/>
            <WzCodeEditor mode='xml' value={editorValue} onChange={(value) => onChange(value)} minusHeight={wazuhNotReadyYet || infoChangesAfterRestart ? 325 : 255}/>
          </Fragment>
        ) : (
          <WzWazuhAPINotReachable error={this.props.errorXMLFetched}/>
        )}
      </Fragment>
    )
  }
})
