/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFacetButton,
  EuiFacetGroup,
  EuiIcon,
  EuiAvatar,
  EuiSpacer,
} from '@elastic/eui'

export class Tactics extends Component {
  _isMount = false;
  state: {
    tacticsList: Array<any>
  }

  props: any;

  constructor(props) {
    super(props);
    this.state = {
      tacticsList: []
    }
  }


  getTacticsList(){
    const tacticsList = Object.keys(this.props.tacticsObject);
    this.setState({tacticsList})
    
  }

  render() {
    return (
      <div style={{backgroundColor: "gray", padding: 10}}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h1>Tactics</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>botton
          </EuiFlexItem>
        </EuiFlexGroup>
        {this.getTacticsList()}
      </div>
    )
  }
}
