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
    const { keyItem, description, value } = this.props;
    return (
      <Fragment>
        {value ? (
          <Fragment>
            <EuiFlexGroup key={`${keyItem}-${description}`} alignItems='center'>
              <EuiFlexItem style={{justifySelf: 'flex-end'}}>
                  <EuiTextAlign textAlign='right'>
                    {description}
                  </EuiTextAlign>
              </EuiFlexItem>
              <EuiFlexItem grow={2}>
                {Array.isArray(value) ? value.map(v => (
                  <ul>
                    <li><EuiFieldText value={String(v)} readOnly/></li>
                  </ul>
                ))
                : (
                  <EuiFieldText value={String(value)} readOnly/>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='s' />
          </Fragment>
        ) : null}
      </Fragment>
    )
  }
}

WzConfigurationSetting.propTypes = {
  keyItem: PropTypes.string,
  description: PropTypes.string.isRequired,
  // value: PropTypes.string
}

export default WzConfigurationSetting;