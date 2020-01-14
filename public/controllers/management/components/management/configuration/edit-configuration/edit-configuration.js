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
  EuiCallOut
} from "@elastic/eui";

import WzCodeEditor from '../util-components/code-editor';
import withLoading from '../util-hocs/loading';

import { fetchFile, restartNodeSelected, saveFileManager } from '../utils/wz-fetch';
import { validateXML } from '../utils/xml';

import { addToast } from '../util-providers/toast-provider';
import { withWzToast } from '../util-providers/toast-p';

import { updateWazuhNotReadyYet } from '../../../../../../redux/actions/configurationActions';

import { connect } from 'react-redux';
import { compose } from 'redux';

class WzEditorConfiguration extends Component{
  constructor(props){
    super(props);
    this.state = {
      xml: this.props.xmlFetched,
      editorValue: this.props.xmlFetched,
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
      await saveFileManager(this.state.editorValue);
      this.setState({ saving: false, infoChangesAfterRestart: true });
      this.props.addToast({
        title: (
          <Fragment>
            <EuiIcon type='check'/>&nbsp;
        <span>Success. {this.props.node} configuration has been updated</span>
          </Fragment>),
        color: 'success'
      });
    }catch(error){
      console.error(error);
      this.props.addToast({
        title: (
          <Fragment>
            <EuiIcon type='check'/>&nbsp;
            <span>Failed</span>
          </Fragment>),
        color: 'danger'
      });
      this.setState({ saving: false, infoChangesAfterRestart: false });
    }
  }
  editorCancel(){
    this.props.updateConfigurationSection('');
  }
  toggleRestart(){
    this.setState({ restart: !this.state.restart }); 
  }
  onChange(editorValue){
    const xmlError = validateXML(editorValue);
    this.setState({ editorValue, xmlError });
  }
  async confirmRestart(){
    try{
      this.setState({ restarting: true, infoChangesAfterRestart: false } );
      await restartNodeSelected(null, this.props.updateWazuhNotReadyYet);
      this.props.updateWazuhNotReadyYet(false);
      this.setState({ restart: false, restarting: false });
    }catch(error){
      console.error('error restarting', error)
      this.props.updateWazuhNotReadyYet(false);
      this.setState({ restart: false, restarting: false });
    }
  }
  render(){
    const { editorValue, xmlError, restart, restarting, saving, infoChangesAfterRestart } = this.state;
    const { node = 'manager' } = this.props;
    return (
      <Fragment>
        <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem>
                  <EuiButtonEmpty isDisabled={xmlError} onClick={() => this.editorCancel()}>Cancel</EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem>
                {xmlError ? 
                  <EuiButton iconType='alert' isDisabled>XML format error</EuiButton>
                  : <EuiButton isDisabled={saving} iconType='save' onClick={() => this.editorSave()}>Save</EuiButton>
                }
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup justifyContent='flexEnd' style={{marginRight: '10px'}}>
              {restart && !restarting ? 
                (<EuiFlexGroup alignItems='center'>
                  <EuiFlexItem>
                    <span><strong>{node}</strong> will be restarted</span>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty onClick={() => this.toggleRestart()}>Cancel</EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton fill iconType='check' onClick={() => this.confirmRestart()}>Confirm</EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>)
                  : restarting ? 
                    <EuiButton fill isDisabled>
                      <EuiLoadingSpinner size="s"/> Restarting {node}
                    </EuiButton>
                  : <EuiButton fill iconType='refresh' onClick={() => this.toggleRestart()}>Restart {node}</EuiButton>
              }
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s'/>
        <EuiText>
          Edit <span style={{fontWeight: 'bold'}}>ossec.conf</span> of <span style={{fontWeight: 'bold'}}>{node}</span>
          {xmlError && <span style={{ color: 'red'}}> {xmlError}</span>}
        </EuiText>
        {infoChangesAfterRestart && (
          <EuiCallOut iconType='iInCircle' title='Changes will not take effect until a restart is performed.'/>
        )}
        <WzCodeEditor mode='xml' value={editorValue} onChange={(editorValue) => this.onChange(editorValue)} minusHeight={325}/>
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
});

const mapDispatchToProps = (dispatch) => ({
  updateWazuhNotReadyYet: (value) => dispatch(updateWazuhNotReadyYet(value))
});

WzEditorConfiguration.propTypes = {
  wazuhNotReadyYet: PropTypes.string,
  updateWazuhNotReadyYet: PropTypes.func
};

export default compose(
  withWzToast,
  withLoading(async () => {
    const xmlFetched = await fetchFile()
    return { xmlFetched }
  }),
  connect(mapStateToProps, mapDispatchToProps)
)(WzEditorConfiguration);