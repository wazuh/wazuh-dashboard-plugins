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
import React, { Component } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSideNav,
  EuiFieldSearch,
  EuiSuggest,
  EuiIcon
} from '@elastic/eui';

import { TabDescription } from '../../../server/reporting/tab-description';


import checkAdminMode from '../../controllers/management/components/management/ruleset/utils/check-admin-mode';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';

class WzVisualizePopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: "",
      status: 'unchanged',
      suggestValue: '',
      selectedItemName: null
    };
    this.noResults = 0;

    this.visualizeSections = [
      {"subsections" : [
        { name: "Security Events", id: "general",icon:"securityApp"},
        { name: "Integrity Monitoring", id: "fim",icon:"securityApp"},
        { name : "Amazon AWS", id: "aws",icon:"logoAWS"},
      ], name: "Security Information Management",
        icon: "dashboardApp"},
      {"subsections" : [
        { name: "Policy monitoring", id:"pm",icon:"securityApp"},
        { name: "System auditing", id: "audit",icon:"securityApp"},
        { name : "OpenSCAP", id: "oscap",icon:"securityApp"},
        { name : "CIS-CAT", id: "ciscat",icon:"securityApp"},
      ], name: "Auditing and Policy Monitoring",
         icon: "advancedSettingsApp"},
      {"subsections" : [
        { name: "Vulnerabilities", id:"vuls",icon:"securityApp"},
        { name: "VirusTotal", id: "virustotal",icon:"securityApp"},
        { name : "Osquery", id:"osquery",icon:"logoOsquery"},
        { name : "Docker listener", id: "docker",icon:"securityApp"},
        { name : "MITRE ATT&CK", id:"mitre",icon:"securityApp"},
      ], name: "Threat detection and response",
         icon: "securityApp"},
      {"subsections" : [
        { name: "PCI DSS", id: "pci",icon:"securityApp"},
        { name: "GDPR", id: "gdpr",icon:"securityApp"},
        { name : "HIPAA", id: "hipaa",icon:"securityApp"},
        { name : "NIST 800-53", id: "nist",icon:"securityApp"},
      ], name: "Regulatory Compliance",
        icon: "visTagCloud"},
    ];

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    
  }

  componentDidMount() {

  }

  /**
 * Fetch the data for a section: rules, decoders, lists...
 * @param {String} newSection
 */
  async fetchData(newSection) {
    try {
      
    } catch (error) {
    }
  }

  clickMenuItem = section => {
    this.props.managementPopoverToggle();
    window.location.href = `#/manager/?tab=${section}`;
  };


  
  selectItem = name => {
    console.log(name)
  };

 

  createItem = (name, data = {}) => {
    return {
      ...data,
      id: name,
      name,
      isSelected: false,
      onClick: () => this.selectItem(name),
    };
  };

  getInputValue = val => {
    this.setState({
      suggestValue: val,
    });
  };

  

  onItemClick(item) {
    console.log(item)
    alert(`Item [${item.label}] was clicked`);
  }

  getSections(id){
    const currentSection = this.visualizeSections[id];
    
    let failedCounter = 0;
    
    const subsections = currentSection.subsections.filter(item => this.state.searchValue === "" ||  (this.state.searchValue && TabDescription[item.id].description.toLowerCase().includes(this.state.searchValue.toLowerCase())) || (this.state.searchValue && item.name.toLowerCase().includes(this.state.searchValue.toLowerCase()))).map(item=> {
      return (this.createItem(item.name))
    })

    if(failedCounter === subsections.length){
      this.noResults += 1;
      return;
    }


    const sideNav = [ this.createItem(currentSection.name, {
      icon: <EuiIcon type={currentSection.icon} />,
      items: subsections
      })
    ]
    
    return (
      <EuiFlexItem grow={false}>
        <EuiSideNav 
          mobileTitle={currentSection.name}
          isOpenOnMobile={true}
          items={sideNav}
          style={{ width: 270 }}
        />
      </EuiFlexItem>
    )
    
  }

  onSearchFieldChange = e => {
    this.setState({
      searchValue: e.target.value,
    });
  };
  
  createSuggestItem = (item) => {
    return {
      label: item.name,
      description: TabDescription[item.id].description,
      type: { iconType: item.icon, color: 'tint8' },
    };
  };

  getSuggestedItems(){
    let subsections = [];

    for(var i=0; i<4;i++){
      const currentSection = this.visualizeSections[i];
      subsections = subsections.concat(currentSection.subsections.filter(item => this.state.suggestValue === "" ||  (this.state.suggestValue && TabDescription[item.id].description.toLowerCase().includes(this.state.suggestValue.toLowerCase())) || (this.state.suggestValue && item.name.toLowerCase().includes(this.state.suggestValue.toLowerCase()))).map(item=> {
        return (this.createSuggestItem(item))
      }));
    }

    return subsections;
  }

  render() {
    this.noResults = 0;
    const sampleItems = [
      {
        type: { iconType: 'kqlField', color: 'tint4' },
        label: 'Field sample',
        description: "jejej",
      },
      {
        type: { iconType: 'kqlValue', color: 'tint0' },
        label: 'Value sample',
        description: "jajaja",
      },
      {
        type: { iconType: 'kqlSelector', color: 'tint2' },
        label: 'Conjunction sample',
        description: "xdxdxa",
      },
      {
        type: { iconType: 'kqlOperand', color: 'tint1' },
        label: 'Operator sample',
        description: "jajaeja",
      },
      {
        type: { iconType: 'search', color: 'tint8' },
        label: 'Recent search',
      },
      {
        type: { iconType: 'save', color: 'tint3' },
        label: 'Saved search',
      },
    ];
    //suggestions={ () => this.getSuggestedItems()}
    this.getSuggestedItems();

    return (
      <div className="WzManagementSideMenu">
      <EuiFlexGroup  style={{marginBottom: 10}}>
        <EuiFlexItem>
        <EuiFieldSearch
            fullWidth={true}
            style={{marginBottom: 10}}
            placeholder="Filter extensions..."
            value={this.state.searchValue}
            onChange={this.onSearchFieldChange}
            aria-label="Filter extensions..."
          />
          </EuiFlexItem>
      </EuiFlexGroup>{/*
      <EuiFlexGroup>
        <EuiFlexItem >
          
          <EuiSuggest
          status={this.state.status}
          onInputChange={this.getInputValue}
          onItemClick={this.onItemClick}
          className="test"
          tooltipContent="jasjk"
          placeholder="Filter extensions"
          suggestions={this.getSuggestedItems()}
        />
          </EuiFlexItem>
      </EuiFlexGroup>
      */}
      <EuiFlexGroup>
          {this.getSections(0)}
          {this.getSections(1)}
      </EuiFlexGroup>

        <EuiFlexGroup>
          {this.getSections(2)}
          {this.getSections(3)}
        <EuiFlexItem style={{marginTop: 20}}>
          {this.noResults === 4 && (<div>No results</div>)}
        </EuiFlexItem>
        </EuiFlexGroup>

      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};


export default connect(mapStateToProps, null)(WzVisualizePopover);
