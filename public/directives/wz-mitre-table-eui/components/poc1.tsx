/*
 * Wazuh app - React component for alerts stats.
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
import React, { Component } from 'react';
import {
  EuiPanel,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButtonEmpty
} from '@elastic/eui';
import { AttkPopover } from './attk-popover';

export class Poc1 extends Component {
  state: {
    showEmp: boolean
    showAtt: boolean
  }
  props!: {
    mitreobject: object
    addFilter: Function
    addNegativeFilter: Function
  }

  constructor(props) {
    super(props);
    this.state = {
      showAtt: false,
      showEmp: true,
    };
  }

  createTecnique(name, attacks_count, style, id, field) {
    const { showEmp } = this.state;
    console.log(field)
    return (
      <AttkPopover
        name={name}
        attacksCount={attacks_count}
        showEmp={showEmp}
        style={style}
        id={id}
        field={field}
        addFilter={(id) => this.props.addFilter(id, field)}
        addNegativeFilter={(id) => this.props.addNegativeFilter(id, field)} />
    )
  }

  render() {
    const { mitreobject } = this.props;
    const { showAtt, showEmp } = this.state;
    const tecniques = (<div style={{display: "flex"}}> {Object.keys(mitreobject)
    .map(tecn => this.createTecnique(
      tecn, 
      mitreobject[tecn].attacks_count, 
      { alignItems: 'start', background:'rgb(213, 222, 252)'},
      tecn,
      'tactics'))}
    </div>)
    const tactics = Object.keys(mitreobject)
    .map(tecn => (
        <div>
          {mitreobject[tecn].techniques
          .map(tact =>
            this.createTecnique(
              tact.name, 
              tact.attacks_count, 
              { alignItems: 'start'},
              tact.id,
              'id'
            )
          )}
        </div>
      )
    )
    return (
      <EuiPanel>
        <EuiSwitch 
          onChange={event => {this.setState(s => {return {showEmp: !s.showEmp}})}}
          checked={showEmp}
          label='Show tactics without alerts'
          />
        <EuiSpacer size="m" />
        <EuiFlexGroup style={{fontSize:11}} gutterSize='xs'>
          {tecniques}
        </EuiFlexGroup>
        {
          showAtt &&
          <EuiFlexGroup style={{fontSize:11}} gutterSize='xs'>
          {tactics}
          </EuiFlexGroup>
        }
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiButtonEmpty
              onClick={event => {this.setState(s => {return {showAtt: !s.showAtt}})}}
              iconType="arrowDown" >
              View attack list
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    )
  }
}
