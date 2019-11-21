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
  EuiIcon
} from '@elastic/eui';
import ciscatIcon from '../../../img/icons/ico_cis.svg';
import oscapIcon from '../../../img/icons/ico_openscap.svg';
import virusTotalIcon from '../../../img/icons/ico_virustotal.svg';
import mitreIcon from '../../../img/icons/ico_mitre.svg';
import hipaaIcon from '../../../img/icons/ico_hipaa.svg';
import pciIcon from '../../../img/icons/ico_pci.svg';
import nistIcon from '../../../img/icons/ico_nist.svg';
import gdprIcon from '../../../img/icons/ico_gdpr.svg';
import dockerIcon from '../../../img/icons/ico_docker.svg';
import osqueryIcon from '../../../img/icons/ico_osquery.svg';

export class OverviewSideNav extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
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
          icon: <EuiIcon type={pciIcon} />,
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
          icon: <EuiIcon type={ciscatIcon} />,
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
          icon: <EuiIcon type={dockerIcon} />,
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
          icon: <EuiIcon type={gdprIcon} />,
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
          icon: <EuiIcon type={hipaaIcon} />,
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
          icon: <EuiIcon type={nistIcon} />,
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
          icon: <EuiIcon type={oscapIcon} />,
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
          icon: <EuiIcon type={osqueryIcon} />,
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
          icon: <EuiIcon type={virusTotalIcon} />,
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
  

  render() {
    const extensions = this.getExtensions()
    let sideNav = this.getInitialSideNav()

    Object.keys(extensions).forEach((key) => {
      if(this.props.extensions[key] && this.props.extensions[key] === true){
        const currentExtension = extensions[key]
        
        sideNav[currentExtension.navPosition].items.push(currentExtension.item)
      }
    })


    
    return (
      <div className="wz-overview-sidenav">
        <EuiButtonEmpty href="#">
          <EuiIcon type={'arrowLeft'} /> Back to Overview
        </EuiButtonEmpty>
        <div className="wz-padding-20">
          <EuiSideNav
            style={{ width: 192 }}
            items={sideNav}
          />
        </div>
      </div>
    );
  }
}

OverviewSideNav.propTypes = {
  switchTab: PropTypes.func,
  extensions: PropTypes.object
};
