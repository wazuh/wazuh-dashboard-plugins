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
    tacticsList: Array<any>,
    selectedItems: object
  }

  props: any;

  constructor(props) {
    super(props);
    this.state = {
      tacticsList: [],
      selectedItems: {}
    }
  }

  componentDidMount(){
  }

  facetClicked(id){
    const { selectedItems } = this.state;
    selectedItems[id] = selectedItems[id] ? false : true;
    this.setState({selectedItems});
  }


  getTacticsList(){
    const tacticsIds = Object.keys(this.props.tacticsObject);
    const tacticsList:Array<any> = [];
    tacticsIds.map( item => {
      tacticsList.push(
      {
        id: item,
        label: item,
        quantity: 0,  // TODO: count is initialized to 0
        onClick: (id) => this.facetClicked(id),
      });
    });

    this.checkAllChecked(tacticsList);

    return (
      <>
        {tacticsList.map(facet => {
          let iconNode;

          return (
            <EuiFacetButton
              key={facet.id}
              id={`${facet.id}`}
              quantity={facet.quantity}
              isSelected={this.state.selectedItems[facet.id]}
              icon={iconNode}
              onClick={
                facet.onClick ? () => facet.onClick(facet.id) : undefined
              }>
              {facet.label}
            </EuiFacetButton>
          );
        })}
      </>
    );
    
  }

  checkAllChecked(tacticList){

    tacticList.map( item => {
      if(!this.state.selectedItems[item.id])
        console.log("false")
        return;
    });

    console.log("true")
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
        
        <EuiFacetGroup style={{ }}>
          {this.getTacticsList()}
        </EuiFacetGroup>

      </div>
    )
  }
}
