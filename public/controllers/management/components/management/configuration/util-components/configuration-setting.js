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
import PropTypes from 'prop-types';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiSpacer,
  EuiTextAlign
} from "@elastic/eui";

class WzConfigurationSetting extends Component{
  constructor(props){
    super(props);
    this.state = {
      labelAlignment: 'right'
    }
    this.limitResize = 760;
    this.resize = this.resize.bind(this);
  }
  componentDidMount() {
    window.addEventListener("resize", this.resize);
    this.resize();
  }
  componentWillUnmount(){
    window.removeEventListener("resize", this.resize);
  }
  resize() {
    this.setState({labelAlignment: window.innerWidth > 760 ? 'right' : undefined});
  }
  render(){
    const { labelAlignment } = this.state;
    const { keyItem, label, value } = this.props;
    return value ? (
      <Fragment>
        <EuiFlexGroup alignItems='center'>
          <EuiFlexItem style={{justifySelf: 'flex-end'}}>
              <EuiTextAlign textAlign={labelAlignment}>
                {label}
              </EuiTextAlign>
          </EuiFlexItem>
          <EuiFlexItem grow={2}>
            {Array.isArray(value) ? (
              <ul>
                {value.map((v,key) => (
                  <li key={`${keyItem}-${label}-${key}`}><EuiFieldText value={String(v)} readOnly/></li>
                ))}
              </ul>)
            : <EuiFieldText value={String(value)} readOnly/>}
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s' />
      </Fragment>
    ) : null
  }
}

WzConfigurationSetting.propTypes = {
  keyItem: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  // value: PropTypes.string
}

export default WzConfigurationSetting;