import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationSettingsHeader from './configuration-settings-header';
import WzCodeEditor from './code-editor';
import { getJSON, getXML } from '../utils/wz-fetch';

class WzCodeViewer extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { title, mode, description, editorValue, view, settings, json, xml, help } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title={title}
          description={description}
          viewSelected={view}
          settings={settings}
          json={json}
          xml={xml}
          help={help}/>
        <WzCodeEditor mode={mode} value={editorValue} isReadOnly/>
      </Fragment>
    )
  }
}

WzCodeViewer.propTypes = {
  title: Proptypes.string.isRequired,
  mode: Proptypes.string.isRequired,
  view: Proptypes.string.isRequired,
  editorValue: Proptypes.string.isRequired
};

export default WzCodeViewer;

export class WzSettingsViewer extends Component{
  constructor(props){
    super(props);
  }
  render(){
    return (
      <WzCodeEditor mode={this.props.mode} value={(this.props.mode === 'json' ? getJSON : getXML)(this.props.value)} isReadOnly/>
    )
  }
}
