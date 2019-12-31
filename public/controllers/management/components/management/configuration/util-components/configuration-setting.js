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
  }
  render(){
    const { keyItem, label, value } = this.props;
    return value ? (
          <Fragment>
            <EuiFlexGroup alignItems='center'>
              <EuiFlexItem style={{justifySelf: 'flex-end'}}>
                  <EuiTextAlign textAlign='right'>
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