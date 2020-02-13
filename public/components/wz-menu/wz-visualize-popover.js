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
  EuiTitle,
  EuiListGroup,
  EuiListGroupItem,
  EuiFieldSearch,
  EuiSuggest,
  EuiIcon
} from '@elastic/eui';

import { TabDescription } from '../../../server/reporting/tab-description';


import {
  switchTab,
} from '../../redux/actions/visualizeActions';
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
      selectedItemName: null,
      favoriteItems: []
    };
    this.noResults = 0;

    this.visualizeSections = [
      {
        "subsections": [
          { name: "Security Events", id: "general", icon: "securityApp" },
          { name: "Integrity Monitoring", id: "fim", icon: "securityApp" },
          { name: "Amazon AWS", id: "aws", icon: "logoAWS" },
        ], name: "Security Information Management",
        icon: "dashboardApp"
      },
      {
        "subsections": [
          { name: "Policy monitoring", id: "pm", icon: "securityApp" },
          { name: "System auditing", id: "audit", icon: "securityApp" },
          { name: "OpenSCAP", id: "oscap", icon: "securityApp" },
          { name: "CIS-CAT", id: "ciscat", icon: "securityApp" },
        ], name: "Auditing and Policy Monitoring",
        icon: "advancedSettingsApp"
      },
      {
        "subsections": [
          { name: "Vulnerabilities", id: "vuls", icon: "securityApp" },
          { name: "VirusTotal", id: "virustotal", icon: "securityApp" },
          { name: "Osquery", id: "osquery", icon: "logoOsquery" },
          { name: "Docker listener", id: "docker", icon: "securityApp" },
          { name: "MITRE ATT&CK", id: "mitre", icon: "securityApp" },
        ], name: "Threat detection and response",
        icon: "securityApp"
      },
      {
        "subsections": [
          { name: "PCI DSS", id: "pci", icon: "securityApp" },
          { name: "GDPR", id: "gdpr", icon: "securityApp" },
          { name: "HIPAA", id: "hipaa", icon: "securityApp" },
          { name: "NIST 800-53", id: "nist", icon: "securityApp" },
        ], name: "Regulatory Compliance",
        icon: "visTagCloud"
      },
    ];

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {

  }

  componentDidMount() {

  }


  selectItem = id => {
    window.location.href = `#/visualize/`;
    this.props.switchTab(id);
  };



  createItem = (name, id) => {
    return {
      id: name,
      name,
      isSelected: false,
      onClick: () => this.selectItem(id),
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

  getSections(id) {
    const currentSection = this.visualizeSections[id];

    let failedCounter = 0;

    const subsections = currentSection.subsections.filter(item => this.state.searchValue === "" || (this.state.searchValue && TabDescription[item.id].description.toLowerCase().includes(this.state.searchValue.toLowerCase())) || (this.state.searchValue && item.name.toLowerCase().includes(this.state.searchValue.toLowerCase()))).map(item => {
      return (this.createItem(item.name,item.id))
    })

    if (failedCounter === subsections.length) {
      this.noResults += 1;
      return;
    }


    const sideNav = [{
      name: currentSection.name,
      id:0,
      icon: <EuiIcon type={currentSection.icon} color="primary" />,
      items: subsections
    }
    
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
      type: { iconType: item.icon, color: 'primary' },
    };
  };

  getSuggestedItems() {
    let subsections = [];

    for (var i = 0; i < 4; i++) {
      const currentSection = this.visualizeSections[i];
      subsections = subsections.concat(currentSection.subsections.filter(item => this.state.suggestValue === "" || (this.state.suggestValue && TabDescription[item.id].description.toLowerCase().includes(this.state.suggestValue.toLowerCase())) || (this.state.suggestValue && item.name.toLowerCase().includes(this.state.suggestValue.toLowerCase()))).map(item => {
        return (this.createSuggestItem(item))
      }));
    }

    return subsections;
  }

  getFavoriteItems() {
    const result = this.state.favoriteItems.map((item, id) => {
      return (<EuiListGroupItem
        key={id}
        id={id}
        iconType="securityApp"
        label={item}
        onClick={() => window.alert('Button clicked')}
        extraAction={{
          color: 'subdued',
          onClick: () => this.removeFavorite(item),
          iconType: 'starFilled',
          iconSize: 's',
          'aria-label': 'Favorite link1',
        }}
      />)

    })

    return result;
  }

  addFavorite(item) {
    console.log("jeje")
    console.log(this.props)
    this.props.setFavorite(item);

    /*
    console.log("aqui")
    var tmp = this.state.favoriteItems
    tmp.push(item)
    console.log(tmp)
    this.setState({favoriteItems:tmp});*/
  }

  removeFavorite(item) {
    var tmp = this.state.favoriteItems
    tmp.splice(tmp.indexOf(item), 1);

    this.setState({ favoriteItems: tmp });
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
        <EuiFlexGroup>
          <EuiFlexItem grow={false} style={{ marginTop: 15 }}>
            <EuiTitle style={{ padding: '0px 16px 6px 16px' }}>
              <h2>History</h2>
            </EuiTitle>
            <EuiListGroup maxWidth={288}>
              <EuiListGroupItem
                id="link1"
                iconType="logoAWS"
                label="Amazon AWS"
                onClick={() => window.alert('Button clicked')}
                extraAction={{
                  color: 'subdued',
                  onClick: () => this.addFavorite('Amazon AWS'),
                  iconType: 'starEmpty',
                  iconSize: 's',
                  'aria-label': 'Favorite link1',
                }}
              />

              <EuiListGroupItem
                id="link2"
                iconType="securityApp"
                onClick={() => window.alert('Button clicked')}
                label="CIS-CAT"
                extraAction={{
                  color: 'subdued',
                  onClick: () => this.addFavorite('CIS-CAT'),
                  iconType: 'starEmpty',
                  iconSize: 's',
                  'aria-label': 'Favorite link2',
                }}
              />

              <EuiListGroupItem
                id="link3"
                onClick={() => window.alert('Button clicked')}
                iconType="securityApp"
                label="Security Events"
                extraAction={{
                  color: 'subdued',
                  onClick: () => this.addFavorite('Security Events'),
                  iconType: 'starEmpty',
                  iconSize: 's',
                  'aria-label': 'Favorite link3',
                }}
              />

              <EuiListGroupItem
                id="link4"
                iconType="logoOsquery"
                label="Osquery"
                extraAction={{
                  color: 'subdued',
                  onClick: () => this.addFavorite('Osquery'),
                  iconType: 'starEmpty',
                  iconSize: 's',
                  'aria-label': 'Favorite link4',
                }}
              />
              <EuiListGroupItem
                id="link5"
                iconType="securityApp"
                label="Integrity Monitoring"
                extraAction={{
                  color: 'subdued',
                  onClick: () => this.addFavorite('Integrity Monitoring'),
                  iconType: 'starEmpty',
                  iconSize: 's',
                  'aria-label': 'Favorite link4',
                }}
              />
            </EuiListGroup>

          </EuiFlexItem>

          <EuiFlexItem>
            {/*
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
      </EuiFlexGroup>
      */}
            <EuiFlexGroup>
              <EuiFlexItem>
                <div style={{ marginBottom: 8, marginRight: 16 }}>
                  <EuiSuggest
                    status={this.state.status}
                    onInputChange={this.getInputValue}
                    onItemClick={this.onItemClick}
                    className="test"
                    tooltipContent="jasjk"
                    placeholder="Filter extensions"
                    suggestions={this.getSuggestedItems()}
                  />
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup style={{ paddingTop: 8, paddingBottom: 8 }}>
              {this.getSections(0)}
              {this.getSections(1)}
            </EuiFlexGroup>
            <EuiFlexGroup style={{ paddingTop: 8, paddingBottom: 8 }}>
              {this.getSections(2)}
              {this.getSections(3)}
              <EuiFlexItem>
                {this.noResults === 4 && (<div>No results</div>)}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>


          {this.state.favoriteItems.length > 0 && (
            <EuiFlexItem style={{ marginTop: 15 }}>

              <EuiTitle>
                <h2>Pinned dashboards</h2>
              </EuiTitle>
              <EuiListGroup maxWidth={288}>
                {this.getFavoriteItems()}
              </EuiListGroup>

            </EuiFlexItem>

          )}

        </EuiFlexGroup>


      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    switchTab: tab => dispatch(switchTab(tab))
  }
};

export default connect(null, mapDispatchToProps)(WzVisualizePopover);
