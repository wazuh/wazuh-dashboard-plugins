/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
  EuiIcon,
  EuiPopover,
  EuiContextMenu,
  EuiButtonIcon,
  EuiFacetGroup,
  EuiToolTip
} from '@elastic/eui';
import { requirementsName } from '../../requirement-name';

export class ComplianceRequirements extends Component {
  _isMount = false;
  state: {
    isPopoverOpen: boolean
  }

  props!: {
  };

  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false,
    }
  }

 

  facetClicked(id){
    const { selectedRequirements: oldSelected, onChangeSelectedRequirements } = this.props;
    const selectedRequirements = {
      ...oldSelected,
      [id]: !oldSelected[id]
    }
    onChangeSelectedRequirements(selectedRequirements);
  }


  getRequirementsList(){
    const requirementsCount = this.props.requirementsCount || [];

    const { selectedRequirements } = this.props;
    const requirementIds = Object.keys(this.props.complianceObject);
    const requirementList:Array<any> = requirementIds.map( item => {
      let quantity = 0;
      this.props.complianceObject[item].forEach(subitem => {
        quantity += (requirementsCount.find(requirement => requirement.key === subitem) || {}).doc_count || 0;
      })
      return {
        id: item,
        label: item,
        quantity,
        onClick: (id) => this.facetClicked(id),
      }}
    );
    
    return (
      <>
      {requirementList.sort((a, b) => b.quantity - a.quantity).map(facet => {
        let iconNode;
        const name = requirementsName[facet.label] || `Requirement ${facet.label}`;
        return (
          <EuiFacetButton
            key={"Requirement " + facet.id}
            id={`Requirement ${facet.id}`}
            quantity={facet.quantity}
            isSelected={this.props.selectedRequirements[facet.id]}
            isLoading={this.props.loadingAlerts}
            icon={iconNode}
            onClick={
              facet.onClick ? () => facet.onClick(facet.id) : undefined
            }>

                <EuiToolTip position="top" content={name} anchorClassName="wz-display-inline-grid" >
                  <span style={{
                    display: "block",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis"
                  }}>
                    Requirement {facet.label}
                  </span>
                </EuiToolTip>
            
          </EuiFacetButton>
        );
      })}
      </>
    );
    
  }

  onGearButtonClick(){
    this.setState({isPopoverOpen: !this.state.isPopoverOpen});
  }
  

  closePopover(){
    this.setState({isPopoverOpen: false});
  }

  selectAll(status){
    const {selectedRequirements, onChangeSelectedRequirements} = this.props;
    Object.keys(selectedRequirements).map( item => {
      selectedRequirements[item] = status;
    });
    onChangeSelectedRequirements(selectedRequirements);
  }


  render() {
    const panels = [
      {
        id: 0,
        title: 'Options',
        items: [
          {
            name: 'Select all',
            icon: <EuiIcon type="check" size="m" />,
            onClick: () => {
              this.closePopover();
              this.selectAll(true);
            },
          },
          {
            name: 'Unselect all',
            icon: <EuiIcon type="cross" size="m" />,
            onClick: () => {
              this.closePopover();
              this.selectAll(false);
            },
          },
        ]
      }
    ]
    let sectionStyle = {}
    let title = "";
    if(this.props.section === "gdpr"){
      sectionStyle["height"] = 300;
      title = "GDPR"
    }
    if(this.props.section === "pci"){
      title = "PCI DSS"
    }
    if(this.props.section === "hipaa"){
      title = "HIPAA"
    }
    if(this.props.section === "nist"){
      title = "NIST 800-53"
    }
    if(this.props.section === "tsc"){
      title = "TSC";
      sectionStyle["height"] = 350;
    }
    return (
      <div style={{ backgroundColor: "#80808014", padding: "10px 10px 0 10px", minHeight: 300,  height: "100%"}}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h1>{title}</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false} style={{marginTop:'15px', marginRight:8}}> 
             <EuiPopover
              button={(<EuiButtonIcon iconType="gear" onClick={() => this.onGearButtonClick()}></EuiButtonIcon>)}
              isOpen={this.state.isPopoverOpen}
              panelPaddingSize="none"
              closePopover={() => this.closePopover()}>
                <EuiContextMenu initialPanelId={0} panels={panels} />
           </EuiPopover>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFacetGroup style={{ }}>
          {this.getRequirementsList()}
        </EuiFacetGroup>

      </div>
    )
  }
}
