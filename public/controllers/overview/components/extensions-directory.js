/*
 * Wazuh app - React component for the extensions directory.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
          title: "aws",
          description: TabDescription.aws.description,
          icon: 'logoAWSMono'
        },
        gcp: {
          enabled: props.extensions.gcp,
          title: "Google Cloud Platform",
          description: "GCP description",
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
          icon: "securityApp"
        },
        ciscat:  {
          enabled: props.extensions.ciscat,
          title: TabDescription.ciscat.title,
          description: TabDescription.ciscat.description,
          icon: "securityApp"
        },
      },
      threat: {
        virustotal:  {
          enabled: props.extensions.virustotal,
          title: TabDescription.virustotal.title,
          description: TabDescription.virustotal.description,
          icon: "securityApp"
        },
        osquery:  {
          enabled: props.extensions.osquery,
          title: TabDescription.osquery.title,
          description: TabDescription.osquery.description,
          icon: "securityApp"
        },
        docker:  {
          enabled: props.extensions.docker,
          title: TabDescription.docker.title,
          description: TabDescription.docker.description,
          icon: "securityApp"
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
          icon: "securityApp"
        },
        gdpr:  {
          enabled: props.extensions.gdpr,
          title: TabDescription.gdpr.title,
          description: TabDescription.gdpr.description,
          icon: "securityApp"
        },
        hipaa:  {
          enabled: props.extensions.hipaa,
          title: TabDescription.hipaa.title,
          description: TabDescription.hipaa.description,
          icon: "securityApp"
        },
        nist:  {
          enabled: props.extensions.nist,
          title: TabDescription.nist.title,
          description: TabDescription.nist.description,
          icon: "securityApp"
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