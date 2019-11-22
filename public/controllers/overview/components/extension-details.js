/*
 * Wazuh app - React component for building a card to be used for showing compliance requirements.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiPage,
  EuiPageBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiButtonEmpty,
  EuiSpacer,
  EuiPanel,
  EuiIcon,
  EuiSwitch,
  EuiCode,
  EuiSteps,
  EuiText,
  EuiCodeBlock,
  EuiSubSteps,
} from '@elastic/eui';

export class ExtensionDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: false
    };
    this.steps = [
      {
        title: 'Step 1',
        children: (
          <EuiText>
            <p>step 1</p>
            <EuiCodeBlock language="bash">step1</EuiCodeBlock>
          </EuiText>
        ),
      },
      {
        title: 'Step 2 ',
        children: (
          <EuiText>
            <p>
              step 2
            </p>
            <EuiSubSteps>
              <ol>
                <li>step 2 1</li>
                <li>step 2 2</li>
              </ol>
            </EuiSubSteps>
          </EuiText>
        ),
      }
    ]
  }


  componentDidMount(){
    this.setState({checked: this.props.currentExtension.enabled})
  }


  onSwitchChange = e => {
    this.setState({
      checked: e.target.checked,
    });
    console.log("TODO - enable/disable extension")
  };



  getDetails(){
    return(
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h1>Getting Started</h1>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer></EuiSpacer>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiSteps headingElement="h2" steps={this.steps} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    )
  }


  showExtensionsDetails(){
    return (
      <EuiPage restrictWidth="1100px" style={{ background: 'transparent' }}>
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle size="l">
                 <h1><EuiIcon size="xl" type={this.props.currentExtension.icon} /> {this.props.currentExtension.title}</h1>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}> <EuiButtonEmpty onClick={() => this.props.closeExtensionDetails()}>Close</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m"></EuiSpacer>
          <EuiFlexGroup>
            <EuiFlexItem>
              {this.props.currentExtension.description}
               <EuiSpacer size="xxl"></EuiSpacer>
              <EuiSwitch
                label="Enable or disable this extension"
                checked={this.state.checked}
                onChange={this.onSwitchChange}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="xxl"></EuiSpacer>
          <EuiPanel>
            {this.getDetails()}
          </EuiPanel>
        </EuiPageBody>
      </EuiPage>
      )
  }

  render() {
    return (
      <div>
        {this.showExtensionsDetails()}
      </div>
    );
  }

}

ExtensionDetails.propTypes = {
  currentExtension: PropTypes.object,
  closeExtensionDetails: PropTypes.func
};
