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
import WzToastP from './util-providers/toast-p';

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
	}
	updateConfigurationSection = (section) => {
		this.setState({ section });
	}
	render(){
		const { section } = this.state;
		return (
			<WzReduxProvider>
				<WzToastP>
					<EuiPage>
						<EuiPanel>
							<WzViewSelector view={section}>
								<div default>
									<WzConfigurationOverview updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='global-configuration'>
									<WzConfigurationGlobalConfiguration updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='cluster'>
									<WzConfigurationCluster updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='registration-service'>
									<WzConfigurationRegistrationService updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='alerts'>
									<WzConfigurationAlerts updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='integrations'>
									<WzConfigurationIntegrations updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='policy-monitoring'>
									<WzConfigurationPolicyMonitoring updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='cis-cat'>
									<WzConfigurationCisCat updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='vulnerabilities'>
									<WzConfigurationVulnerabilities updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='osquery'>
									<WzConfigurationOsquery updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='inventory'>
									<WzConfigurationInventory updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='active-response'>
									<WzConfigurationActiveResponse updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='commands'>
									<WzConfigurationCommands updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='log-collection'>
									<WzConfigurationLogCollection updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='integrity-monitoring'>
									<WzConfigurationIntegrityMonitoring updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='agentless'>
									<WzConfigurationIntegrityAgentless updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='aws-s3'>
									<WzConfigurationIntegrityAmazonS3 updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='edit-configuration'>
									<WzConfigurationEditConfiguration updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
							</WzViewSelector>
						</EuiPanel>
						{/* <ToastProvider /> */}
					</EuiPage>
				</WzToastP>
			</WzReduxProvider>
		)
	}
}


export default WzConfigurationMain;
