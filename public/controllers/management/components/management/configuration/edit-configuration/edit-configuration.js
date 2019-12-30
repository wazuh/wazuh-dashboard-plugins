import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiLoadingSpinner
} from "@elastic/eui";

import WzCodeEditor from '../util-components/code-editor';
import WzConfigurationPath from '../util-components/configuration-path';
import withLoading from '../util-hocs/loading';

import { updateConfigurationSection } from '../../../../../../redux/actions/configurationActions';
import { fetchFile, restartNodeSelected, saveFileManager } from '../utils/wz-fetch';
import { validateXML } from '../utils/xml';

import { addToast } from '../util-providers/toast-provider';

const WzEditorConfiguration = withLoading(async () => {
  const xmlFetched = await fetchFile()
  return { xmlFetched }
})(class extends Component{
  constructor(props){
    super(props);
    this.state = {
      xml: this.props.xmlFetched,
      editorValue: this.props.xmlFetched,
      xmlError: false,
      restart: false,
      restarting: false,
      saving: false
    };
  }
  async editorSave(){
    try{
      this.setState({ saving: true});
      await saveFileManager(this.state.editorValue);
      this.setState( { saving: false });
      addToast({
        title: (
          <Fragment>
            <EuiIcon type='check'/>&nbsp;
            <span>Success. Manager configuration has been updated</span>
          </Fragment>),
        color: 'success'
      })
    }catch(error){
      console.error(error);
    }
  }
  editorCancel(){
    this.props.updateConfigurationSection('');
  }
  toggleRestart(){
    this.setState( { restart: !this.state.restart } ); 
  }
  confirmRestart(){
    this.setState( { restart: !this.state.restart, restarting: true } ); 
  }
  onChange(editorValue){
    const xmlError = validateXML(editorValue);
    this.setState({ editorValue, xmlError });
  }
  async confirmRestart(){
    try{
      this.setState( { restarting: true } );
      await restartNodeSelected();
      this.setState( { restart: false, restarting: false } );
    }catch(error){
      this.setState( { restart: false, restarting: false } );
    }
  }
  render(){
    const { editorValue, xml, xmlError, restart, restarting, saving } = this.state;
    return (
      <Fragment>
        <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem>
                  <EuiButtonEmpty onClick={() => this.editorCancel()}>Cancel</EuiButtonEmpty>
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
                    <span><strong>manager</strong> will be restarted</span>
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
                      <EuiLoadingSpinner size="s"/> Restarting manager
                    </EuiButton>
                  : <EuiButton fill iconType='refresh' onClick={() => this.toggleRestart()}>Restart manager</EuiButton>
              }
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s'/>
        <EuiText>
          Edit <span style={{fontWeight: 'bold'}}>ossec.conf</span> of <span style={{fontWeight: 'bold'}}>manager</span>
          {xmlError && <span style={{ color: 'red'}}> {xmlError}</span>}
        </EuiText>
        <WzCodeEditor mode='xml' value={editorValue} onChange={(editorValue) => this.onChange(editorValue)}/>
      </Fragment>
    )
  }
})
class WzEditConfiguration extends Component{
  constructor(props){
    super(props);
  }
  render(){
    return (
      <Fragment>
        {/* TODO: Missing gear icon */}
        <WzConfigurationPath title='Manager configuration' path='Edit Configuration' updateConfigurationSection={this.props.updateConfigurationSection}/>
        <WzEditorConfiguration updateConfigurationSection={this.props.updateConfigurationSection}/>
      </Fragment>
    )
  }
}

// TODO: Editor, cancel, save and restart manager is hidden while load/fetch ossec.conf file text
export default WzEditConfiguration;