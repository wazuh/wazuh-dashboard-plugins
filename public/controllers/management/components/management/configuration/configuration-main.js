import React, { Component } from 'react';

import WzReduxProvider from '../../../../../redux/wz-redux-provider';
import WzConfigurationOverview from './configuration-overview';
import WzConfigurationGlobalConfiguration from './global-configuration/global-configuration';
import WzConfigurationEditConfiguration from './edit-configuration/edit-configuration';
import WzConfigurationRegistrationService from './registration-service/registration-service';
import WzConfigurationCluster from './cluster/cluster';
import WzConfigurationAlerts from './alerts/alerts';
import WzConfigurationIntegrations from './integrations/integrations';
import WzConfigurationPolicyMonitoring from './policy-monitoring/policy-monitoring';
import WzConfigurationCisCat from './cis-cat/cis-cat';
import WzConfigurationVulnerabilities from './vulnerabilities/vulnerabilities';
import WzConfigurationOsquery from './osquery/osquery';
import WzConfigurationInventory from './inventory/inventory';
import WzConfigurationActiveResponse from './active-response/active-response';
import WzConfigurationCommands from './commands/commands';
import WzConfigurationLogCollection from './log-collection/log-collection';
import WzConfigurationIntegrityMonitoring from './integrity-monitoring/integrity-monitoring';
import WzConfigurationIntegrityAgentless from './agentless/agentless';
import WzConfigurationIntegrityAmazonS3 from './aws-s3/aws-s3';
import WzViewSelector from './util-components/view-selector';
import WzConfigurationPath from './util-components/configuration-path';

import { connect } from "react-redux";

import { checkDaemons } from './utils/wz-fetch';
import ToastProvider from './util-providers/toast-provider';

import {
	EuiPage,
	EuiPanel
} from "@elastic/eui";

class WzConfigurationMain extends Component{
	constructor(props){
			super(props);
			this.state = {
				section: ''
			};
			this.updateConfigurationSection = this.updateConfigurationSection.bind(this);
	}
	updateConfigurationSection(section){
		this.setState({ section });
	}
	render(){
		const { section } = this.state;
		return (
			<WzReduxProvider>
				<EuiPage>
					<EuiPanel>
						{(section === 'global-configuration' && (<WzConfigurationGlobalConfiguration updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'cluster' && (<WzConfigurationCluster updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'registration-service' && (<WzConfigurationRegistrationService updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'alerts' && (<WzConfigurationAlerts updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'integrations' && (<WzConfigurationIntegrations updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'policy-monitoring' && (<WzConfigurationPolicyMonitoring updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'cis-cat' && (<WzConfigurationCisCat updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'vulnerabilities' && (<WzConfigurationVulnerabilities updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'osquery' && (<WzConfigurationOsquery updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'inventory' && (<WzConfigurationInventory updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'active-response' && (<WzConfigurationActiveResponse updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'commands' && (<WzConfigurationCommands updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'log-collection' && (<WzConfigurationLogCollection updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'integrity-monitoring' && (<WzConfigurationIntegrityMonitoring updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'agentless' && (<WzConfigurationIntegrityAgentless updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'aws-s3' && (<WzConfigurationIntegrityAmazonS3 updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(section === 'edit-configuration' && (<WzConfigurationEditConfiguration updateConfigurationSection={this.updateConfigurationSection}/>)) ||
							(<WzConfigurationOverview updateConfigurationSection={this.updateConfigurationSection}/>)
						}
					</EuiPanel>
					<ToastProvider />
				</EuiPage>
			</WzReduxProvider>
		)
	}
}


export default WzConfigurationMain;
