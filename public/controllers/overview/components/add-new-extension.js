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
import { TabDescription } from '../../../../server/reporting/tab-description';
import {
  EuiPage,
  EuiPanel,
  EuiPageBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiTabbedContent,
  EuiText,
  EuiSpacer,
  EuiFlexGrid,
  EuiCard,
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

export class AddNewExtension extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTab: '',
      isShowingExtension: false
    };
    this.extensionsGroups = {
      security: {
        aws: {
          enabled: props.extensions.aws,
          title: TabDescription.aws.title,
          description: TabDescription.aws.description,
          icon: 'logoAWSMono'
        },
        gcp: {
          enabled: props.extensions.gcp,
          title: TabDescription.gcp.title,
          description: TabDescription.gcp.description,
          icon: 'logoGCPMono'
        },
      },
      auditing: {
        audit: {
          enabled: props.extensions.audit,
          title: TabDescription.audit.title,
          description: TabDescription.audit.description,
          icon: 'monitoringApp'
        },
        oscap:  {
          enabled: props.extensions.oscap,
          title: TabDescription.oscap.title,
          description: TabDescription.oscap.description,
          icon: oscapIcon
        },
        ciscat:  {
          enabled: props.extensions.ciscat,
          title: TabDescription.ciscat.title,
          description: TabDescription.ciscat.description,
          icon: ciscatIcon
        },
      },
      threat: {
        virustotal:  {
          enabled: props.extensions.virustotal,
          title: TabDescription.virustotal.title,
          description: TabDescription.virustotal.description,
          icon: virusTotalIcon
        },
        osquery:  {
          enabled: props.extensions.osquery,
          title: TabDescription.osquery.title,
          description: TabDescription.osquery.description,
          icon: osqueryIcon
        },
        docker:  {
          enabled: props.extensions.docker,
          title: TabDescription.docker.title,
          description: TabDescription.docker.description,
          icon: dockerIcon
        },
        /*
        mitre: {
          enabled: props.extensions.mitre,
          title: TabDescription.mitre.title,
          description: TabDescription.mitre.description,
          icon: mitreIcon
        },*/
      },
      regulatory: {
        pci:  {
          enabled: props.extensions.pci,
          title: TabDescription.pci.title,
          description: TabDescription.pci.description,
          icon: pciIcon
        },
        gdpr:  {
          enabled: props.extensions.gdpr,
          title: TabDescription.gdpr.title,
          description: TabDescription.gdpr.description,
          icon: gdprIcon
        },
        hipaa:  {
          enabled: props.extensions.hipaa,
          title: TabDescription.hipaa.title,
          description: TabDescription.hipaa.description,
          icon: hipaaIcon
        },
        nist:  {
          enabled: props.extensions.nist,
          title: TabDescription.nist.title,
          description: TabDescription.nist.description,
          icon: nistIcon
        },
      }
    }
  }

  getIcon(extension){
    return (<EuiIcon size="xl" type={this.extensionsGroups[extension]} />)
  }

getExtensions(group) {
  
  let extensions = []
  if(group === 'all'){
    extensions = {...this.extensionsGroups.security, ...this.extensionsGroups.auditing, ...this.extensionsGroups.threat, ...this.extensionsGroups.regulatory }
  }else{
    extensions = this.extensionsGroups[group]
  }

  const extensionsPanel = Object.keys(extensions).map((key, index) => {
    const currentExtension = extensions[key];
    return(
      <EuiFlexItem key={index}>
         <EuiCard
          layout="horizontal"
          icon={(<EuiIcon size="xl" type={currentExtension.icon} />) }
          title={currentExtension.title}
          description={currentExtension.description}
          onClick={() => window.alert('TODO - ' + key)}
        />
      </EuiFlexItem>
    )
  });
  return extensionsPanel;
}


showExtensions() {
  const tabs = [
    {
      id: 'all',
      name: 'All',
      content: (
        <Fragment>
          <EuiSpacer />
            <EuiFlexGrid columns={4}>
              {this.getExtensions('all')}
            </EuiFlexGrid>
        </Fragment>
      ),
    },
    {
      id: 'security',
      name: 'Security information management',
      content: (
        <Fragment>
          <EuiSpacer />
            <EuiFlexGrid columns={4}>
              {this.getExtensions('security')}
            </EuiFlexGrid>
        </Fragment>
      ),
    },
    {
      id: 'auditing',
      name: 'Auditing and policy monitoring',
      content: (
        <Fragment>
          <EuiSpacer />
            <EuiFlexGrid columns={4}>
              {this.getExtensions('auditing')}
            </EuiFlexGrid>
        </Fragment>
      ),
    },
    {
      id: 'threat',
      name: 'Threat detection and response',
      content: (
        <Fragment>
          <EuiSpacer />
            <EuiFlexGrid columns={4}>
              {this.getExtensions('threat')}
            </EuiFlexGrid>
        </Fragment>
      ),
    },
    {
      id: 'regulatory',
      name: 'Regulatory Compliance',
      content: (
        <Fragment>
          <EuiSpacer />
            <EuiFlexGrid columns={4}>
              {this.getExtensions('regulatory')}
            </EuiFlexGrid>
        </Fragment>
      ),
    },
  ]

  return (
    <EuiTabbedContent
        tabs={tabs}
        initialSelectedTab={tabs[0]}
        autoFocus="initial"
        onTabClick={tab => {
          console.log('clicked tab', tab);
        }}
      />
  )
}

showCards(){
return (
  <EuiPage restrictWidth="1100px" style={{ background: 'transparent' }}>
    <EuiPageBody>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size="l">
            <h1>Wazuh extensions directory</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>TODO back button
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m"></EuiSpacer>
      <EuiFlexGroup>
        <EuiFlexItem>
          {this.showExtensions()}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPageBody>
  </EuiPage>
  )
}

  render() {

    
    return (
      <div>
        {(!this.state.isShowingExtension && this.showCards())}
      </div>
    );
  }
}

AddNewExtension.propTypes = {
  extensions: PropTypes.object
};
