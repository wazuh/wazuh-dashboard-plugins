import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";
import { connect } from "react-redux";

import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiText,
  EuiTitle,
  EuiSpacer
} from "@elastic/eui";

import WzCodeEditor from '../util-components/code-editor';
import WzConfigurationPath from '../util-components/configuration-path';
import { updateConfigurationSection } from '../../../../../../redux/actions/configurationActions';

class WzEditConfiguration extends Component{
  constructor(props){
    super(props);
    this.state = {
      editorValue: ''
    }
    this.titleComponent = (
      <EuiText>
        Edit <span style={{fontWeight: 'bold'}}>ossec.conf</span> of <span style={{fontWeight: 'bold'}}>manager</span>
      </EuiText>
    )
  }
  editorSave(){
    window.alert('Saving');
    console.log('Saving...', this.state.editorValue);
  }
  editorCancel(){
    window.alert('Canceling');
    console.log('Canceling...', this.state.editorValue);
  }
  editorRestart(){
    window.alert('Restarting');
    console.log('Restarting...', this.state.editorValue);
  }
  onEditorChange(editorValue){
    this.setState({ editorValue })
  }
  render(){
    const { editorValue } = this.state;
    return (
      <Fragment>
        {/* TODO: Missing gear icon */}
        <WzConfigurationPath title='Manager configuration' path='Edit Configuration' updateConfigurationSection={this.props.updateConfigurationSection}/>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem>
                  <EuiButtonEmpty onClick={() => this.editorCancel()}>Cancel</EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem>
                  <EuiButton iconType='save' onClick={() => this.editorSave()}>Save</EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup justifyContent='flexEnd'>
              <EuiButton fill iconType='refresh' style={{marginRight: '10px'}} onClick={() => this.editorRestart()}>Restart manager</EuiButton>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s'/>
        <WzCodeEditor mode='xml' value={editorValue} onChange={(editorValue) => this.onEditorChange(editorValue)} titleComponent={this.titleComponent}/>
      </Fragment>
    )
  }
}

// TODO: Editor, cancel, save and restart manager is hiiden while load/fetch ossec.conf file text
export default WzEditConfiguration;