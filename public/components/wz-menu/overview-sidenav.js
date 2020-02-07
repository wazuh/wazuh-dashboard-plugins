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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  EuiSideNav,
  EuiButtonEmpty,
  EuiButton,
  EuiButtonIcon,
  EuiToolTip,
  EuiIcon
} from '@elastic/eui';
import { EuiFlexGroup } from '@elastic/eui';
import { EuiFlexItem } from '@elastic/eui';

export class OverviewSideNav extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowing: false
    };
    this.getAddNewExtensionButton = this.getAddNewExtensionButton.bind(this)
  }

  componentDidMount(){
    this.setState({isShowing: true})
  }


  getExtensions() {

    /**
     * navPosition: 
     * 0 - Security Information Management
     * 1 - Auditing and policy monitoring
     * 2 - Threat detection and response
     * 3 - Regulatory compliance
     * 
     * item:
     * item to be rendered in the EuiSideNav
     * 
     *  */ 
    return {
      audit: {
        navPosition: 1,
        item: {
          name: 'System auditing',
          id: 2,
          onClick: () => {
            this.props.switchTab('audit');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },
      pci: {
        navPosition: 3,
        item: {
          name: 'PCI DSS',
          id: 1,
          onClick: () => {
            this.props.switchTab('pci');
          },
          icon: <EuiIcon type="monitoringApp" />,
        },
      },
      aws : {
        navPosition: 0,
        item: {
          name: 'Amazon aws',
          id: 3,
          onClick: () => {
            this.props.switchTab('aws');
          },
          icon: <EuiIcon type="logoAWSMono" />,
        }
      },
      ciscat: {
        navPosition: 1,
        item: {
          name: 'CIS-CAT',
          id: 4,
          onClick: () => {
            this.props.switchTab('ciscat');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },      
      docker: {
        navPosition: 2,
        item: {
          name: 'Docker listener',
          id: 4,
          onClick: () => {
            this.props.switchTab('docker');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },
      gdpr: {
        navPosition: 3,
        item: {
          name: 'GDPR',
          id: 2,
          onClick: () => {
            this.props.switchTab('gdpr');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },
      hipaa: {
        navPosition: 3,
        item: {
          name: 'HIPAA',
          id: 3,
          onClick: () => {
            this.props.switchTab('hipaa');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },
      nist: {
        navPosition: 3,
        item: {
          name: 'NIST 800-53',
          id: 4,
          onClick: () => {
            this.props.switchTab('nist');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },
      oscap: {
        navPosition: 1,
        item: {
          name: 'OpenSCAP',
          id: 3,
          onClick: () => {
            this.props.switchTab('oscap');
          },
          icon: <EuiIcon type="monitoringApp" />,
        },
      },
      osquery: {
        navPosition: 2,
        item: {
          name: 'Osquery',
          id: 3,
          onClick: () => {
            this.props.switchTab('osquery');
          },
          icon: <EuiIcon type="monitoringApp" />,
        }
      },
      virustotal: {
        navPosition: 2,
        item: {
          name: 'VirusTotal',
          id: 2,
          onClick: () => {
            this.props.switchTab('virustotal');
          },
          icon: <EuiIcon type="monitoringApp" />,
        },
      },
    }
  }

  getInitialSideNav(){
    const sideNav = [
      {
        name: 'Security Information Management',
        id: 0,
        items: [
          {
            name: 'Security events',
            id: 1,
            onClick: () => {
              this.props.switchTab('general');
            },
            icon: <EuiIcon type="dashboardApp" />,
          },
          {
            name: 'Integrity monitoring',
            id: 2,
            onClick: () => {
              this.props.switchTab('fim');
            },
            icon: <EuiIcon type="loggingApp" />,
          },
          
        ],
      },
      {
        name: 'Auditing and policy monitoring',
        id: 1,
        items: [
          {
            name: 'Policy monitoring',
            id: 1,
            onClick: () => {
              this.props.switchTab('pm');
            },
            icon: <EuiIcon type="advancedSettingsApp" />,
          },
        ],
      },
      {
        name: 'Threat detection and response',
        id: 3,
        items: [
          {
            name: 'Vulnerabilities',
            id: 1,
            onClick: () => {
              this.props.switchTab('vuls');
            },
            icon: <EuiIcon type="securityApp" />,
          },
        ],
      },
      {
        name: 'Regulatory compliance',
        id: 4,
        items: [
        ],
      },
    ];

    return sideNav;
  }
  

  getAddNewExtensionButton() {
    return (
        <EuiButton
        className={"wz-add-new-extension"}
        onClick={() => this.props.switchTab('newExtension')}>
          Add a new extension
        </EuiButton>
    )
  }


  switchSideNav() {
    this.setState({isShowing: !this.state.isShowing})
    this.props.switchSideNav(this.state.isShowing)
  }




  render() {    
    const extensions = this.getExtensions()
    let sideNav = this.getInitialSideNav()

    Object.keys(extensions).forEach((key) => {
      if(this.props.extensions[key] && this.props.extensions[key] === true){
        const currentExtension = extensions[key]
        
        sideNav[currentExtension.navPosition].items.push(currentExtension.item)
      }
    })

    // Force the last button to be "Add a new extension"
    sideNav[3].items.push(
        {
        id: 10,
        renderItem: this.getAddNewExtensionButton,
        },
    )
    
    return (
      <div className="wz-overview-sidenav">
        {this.state.isShowing && (
        <div>
          <EuiFlexGroup
            className="wz-padding-left-5">
            <EuiFlexItem>
              <EuiButtonEmpty
                onClick={() => this.props.switchTab("welcome",true)}>
                <EuiIcon type={'arrowLeft'} /> Back to Overview
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiToolTip position="right" content="Hide side nav">
                <EuiButtonEmpty
                  onClick={() => this.switchSideNav()}>
                  <EuiIcon type={'menuLeft'} />
                </EuiButtonEmpty>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
          <div className="wz-padding-20 wz-padding-top-10">
            <EuiSideNav
              style={{ width: 192 }}
              items={sideNav}
            />
          </div>
        </div>
        ) || (
          <EuiToolTip position="right" content="Open side nav">
            <EuiButtonIcon
              onClick={() => this.switchSideNav()}
              iconType={'menuRight'}
              aria-label="Open side nav"
              className={"wz-close-side-nav-margin "} /> 
          </EuiToolTip>
            
            )}
      </div>
    );
  }
}

OverviewSideNav.propTypes = {
  switchTab: PropTypes.func,
  extensions: PropTypes.object,
  switchSideNav: PropTypes.func
};
