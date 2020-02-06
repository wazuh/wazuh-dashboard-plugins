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
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiSpacer
} from '@elastic/eui';


 export class Poc2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowingTechniques:""
  };
  }

  async componentDidMount() {
    console.log(this.props)
  }



  selectTactic(tactic){
    this.setState({isShowingTechniques : this.state.isShowingTechniques === tactic ? "" : tactic });
  }

  getTacticsCards(){
    const orderedArray = [
      "Initial Access",
      "Execution" ,
      "Persistence",
      "Privilege Escalation",
      "Defense Evation",
      "Credential Access" ,
      "Discovery" ,
      "Lateral Movement" ,
      "Collection" ,
      "Command And Control" ,
      "Exfiltriation",
      "Impact" 
    ]

    const result = orderedArray.map( (item,idx) => {
      return (
        <EuiFlexItem grow={false}>
          <EuiToolTip position="top" content={"View " + item + " techniques"}>
            <EuiFacetButton onClick={() => this.selectTactic(item)} style={{padding: "10px", "backgroundColor": this.state.isShowingTechniques === item ? "rgba(124, 124, 241, 0.73)" : "#0000ff14", borderRadius: "15px"}} quantity={this.props[item].attacks_count}>{item}</EuiFacetButton>
          </EuiToolTip>
        </EuiFlexItem>
      )
    } )

    return (<EuiFlexGroup wrap>{result}</EuiFlexGroup>);
  }

  getTechniques(){ 
    

    const result = this.props[this.state.isShowingTechniques].techniques.map( (item,idx) => {
      return (
        <EuiFlexItem grow={false}>
           <EuiFacetButton onClick={() => {}} style={{padding: "10px", borderRadius: "15px"}} quantity={this.props[item].attacks_count}>{item}</EuiFacetButton>
        </EuiFlexItem>
      )
    } )

    return (<EuiFlexGroup wrap>{result}</EuiFlexGroup>);
  }

  render(){
    return (<div style={{margin: "10px"}}> 
      <EuiPanel paddingSize="m" hasShadow>
         {this.getTacticsCards()}
      </EuiPanel>
      <EuiSpacer size="xs" />
      <EuiPanel paddingSize="m" hasShadow>
         {this.getTechniques()}
      </EuiPanel>

    </div>)
  }

}