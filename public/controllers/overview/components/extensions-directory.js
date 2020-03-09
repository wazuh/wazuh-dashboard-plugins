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
  EuiIcon,
  EuiButtonEmpty,
  EuiButton,
  EuiSwitch
} from '@elastic/eui';

import WzExtensionGuide from './extension-guide';
import { AppState } from '../../../react-services/app-state';
import { SampleData } from './sample-data';

export class AddNewExtension extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTab: '',
      isShowingExtension: false,
      currentExtensionData: ''
    };
    this.closeExtensionDetails = this.closeExtensionDetails.bind(this)

    this.extensionsGroups = {
      security: {
        aws: {
          enabled: props.extensions.aws,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          title: "AWS",
          description: TabDescription.aws.description,
          icon: 'logoAWSMono'
        },
        // gcp: {
        //   enabled: props.extensions.gcp,
        //   title: "Google Cloud Platform",
        //   url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
        //   description: "GCP description - GCP description - GCP description - GCP description ",
        //   icon: 'logoGCPMono'
        // },
        fim: {
          enabled: props.extensions.fim,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          title: "Integrity monitoring",
          description: TabDescription.fim.description,
          icon: 'filebeatApp'
        }
      },
      auditing: {
        audit: {
          enabled: props.extensions.audit,
          title: TabDescription.audit.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.audit.description,
          icon: 'monitoringApp'
        },
        oscap:  {
          enabled: props.extensions.oscap,
          title: TabDescription.oscap.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.oscap.description,
          icon: "securityApp"
        },
        ciscat:  {
          enabled: props.extensions.ciscat,
          title: TabDescription.ciscat.title,
          url: TabDescription.ciscat.url,
          description: TabDescription.ciscat.description,
          icon: "securityApp"
        },
      },
      threat: {
        vuls:  {
          enabled: props.extensions.virustotal,
          title: TabDescription.vuls.title,
          url: TabDescription.vuls.url,
          description: TabDescription.vuls.description,
          icon: "securityApp"
        },
        virustotal:  {
          enabled: props.extensions.virustotal,
          title: TabDescription.virustotal.title,
          url: TabDescription.virustotal.url,
          description: TabDescription.virustotal.description,
          icon: "securityApp"
        },
        osquery:  {
          enabled: props.extensions.osquery,
          title: TabDescription.osquery.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.osquery.description,
          icon: "securityApp"
        },
        docker:  {
          enabled: props.extensions.docker,
          title: TabDescription.docker.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.docker.description,
          icon: "logoDocker"
        },
        /*
        mitre: {
          enabled: props.extensions.mitre,
          title: TabDescription.mitre.title,
          title: TabDescription.mitre.title,
          description: TabDescription.mitre.description,
          icon: mitreIcon
        },*/
      },
      regulatory: {
        pci:  {
          enabled: props.extensions.pci,
          title: TabDescription.pci.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.pci.description,
          icon: "securityApp"
        },
        gdpr:  {
          enabled: props.extensions.gdpr,
          title: TabDescription.gdpr.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.gdpr.description,
          icon: "securityApp"
        },
        hipaa:  {
          enabled: props.extensions.hipaa,
          title: TabDescription.hipaa.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.hipaa.description,
          icon: "securityApp"
        },
        nist:  {
          enabled: props.extensions.nist,
          title: TabDescription.nist.title,
          url: '/plugins/wazuh/img/dashboards/osquery_dashboard.png',
          description: TabDescription.nist.description,
          icon: "securityApp"
        },
      }
    }
  }
  // Get extension enabled from ookie
  // componentDidMount(){
  //   const apiID = JSON.parse(this.props.api).id
  //   const extensions = AppState.getExtensions(apiID);
  //   this.setState(extensions);
  // }
  // Change ookie extension enabled
  // onChangeToggleExtensionVisibility = (extensionID, value) => {
  //   // used for change extension visibility in currentExtensions cookie
  //   try{
  //     const apiID = JSON.parse(this.props.api).id
  //     const extensions = AppState.getExtensions(apiID);
  //     const newValue = {
  //       ...extensions,
  //       [extensionID]: value
  //     }
  //     AppState.setExtensions(apiID, newValue);
  //     this.setState({
  //       [extensionID]: value
  //     });
  //   }catch(error){}
  // }
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
            onClick={ !['pci','gdpr','hipaa','nist'].includes(key) ?
              () => this.setState({currentExtensionData: currentExtension, currentExtensionId: key, isShowingExtension: true}) 
              : undefined
            }
          />
          {/* <EuiCard
            icon={<EuiIcon size="xl" type={currentExtension.icon}  />}
            title={currentExtension.title}
            description={currentExtension.description}
            footer={
              <div>
                {!['pci','gdpr','hipaa','nist'].includes(key) && (
                  <EuiButton
                    aria-label="Go to guide"
                    onClick={
                    () => this.setState({currentExtensionData: currentExtension, currentExtensionId: key, isShowingExtension: true}) 
                    }>
                      Configure
                  </EuiButton>
                )}
                <EuiSpacer size="m" />
                <EuiSwitch
                  label={this.state[key] ? 'Show extension' : 'Hide extension'}
                  checked={this.state[key] !== undefined ? this.state[key] : false}
                  onChange={(e) => this.onChangeToggleExtensionVisibility(key,e.target.checked)}
                />
              </div>
            }
          /> */}
          {/* <EuiCard
            icon={<EuiIcon size="xl" type={currentExtension.icon} />}
            title={currentExtension.title}
            description={currentExtension.description}
            footer={ !['pci','gdpr','hipaa','nist'].includes(key) ? (
              <EuiButtonEmpty
                iconType="iInCircle"
                size="xs"
                onClick={() => this.setState({currentExtensionData: currentExtension, currentExtensionId: key, isShowingExtension: true})}
                aria-label="See more details about Sketch">
                Interactive guide
              </EuiButtonEmpty>
            ) : undefined
            }
            selectable={{
              onClick: () => console.log(''),
              isSelected: currentExtension.enabled,
            }}
          /> */}
        </EuiFlexItem>
      )
    });
    return extensionsPanel;
  }

  getTabs() {
    return [
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
      {
        id: 'data',
        name: 'Sample Data',
        content: (
          <SampleData />
        ),
      },
    ]
  }






  showExtensions() {
    const tabs = this.getTabs()

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
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle size="l">
                <h1>Wazuh extensions directory</h1>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
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

  closeExtensionDetails(){
    this.setState(
      {
        isShowingExtension: false,
        currentExtensionData: ''
      }
    )
  }

  render() {


    return (
      <div>
        {this.state.isShowingExtension ? (
          <WzExtensionGuide
            currentExtensionData={this.state.currentExtensionData}
            closeGuide={this.closeExtensionDetails}
            guideId={this.state.currentExtensionId}
            // onChangeToggleExtensionVisibility={this.onChangeToggleExtensionVisibility}
            // extensionEnabled={this.state[this.state.currentExtensionId]}
          />
        ) : this.showCards()}
      </div>
    );
  }
}

AddNewExtension.propTypes = {
  extensions: PropTypes.object,
  setExtensions: PropTypes.func,
  api: PropTypes.string
};
