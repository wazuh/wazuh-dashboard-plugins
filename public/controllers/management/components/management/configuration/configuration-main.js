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
				view: '',
				viewProps: {},
			};
	}
	updateConfigurationSection = (view, title, description, path) => {
		this.setState({ view, viewProps: {title: title, description, path: path || title} });
	}
	updateBadge = (badgeStatus = false) => {
		this.setState({ viewProps: { ...this.state.viewProps, badge: badgeStatus}})
	}
	render(){
		const { view, viewProps: {title, description, path, badge} } = this.state;
		const { agent } = this.props.configurationProps;
		return (
			<WzReduxProvider>
				<WzToastP>
					<EuiPage>
						<EuiPanel>
							{view !== '' && (<WzConfigurationPath title={title} description={description} path={path} updateConfigurationSection={this.updateConfigurationSection} badge={badge}/>)}
							<WzViewSelector view={view}>
								<div default>
									<WzConfigurationOverview agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='global-configuration'>
									<WzConfigurationGlobalConfiguration agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='cluster'>
									<WzConfigurationCluster agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='registration-service'>
									<WzConfigurationRegistrationService agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='alerts'>
									<WzConfigurationAlerts agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='integrations'>
									<WzConfigurationIntegrations agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='policy-monitoring'>
									<WzConfigurationPolicyMonitoring agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='cis-cat'>
									<WzConfigurationCisCat agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='vulnerabilities'>
									<WzConfigurationVulnerabilities agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='osquery'>
									<WzConfigurationOsquery agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='inventory'>
									<WzConfigurationInventory agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='active-response'>
									<WzConfigurationActiveResponse agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='commands'>
									<WzConfigurationCommands agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='log-collection'>
									<WzConfigurationLogCollection agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='integrity-monitoring'>
									<WzConfigurationIntegrityMonitoring agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='agentless'>
									<WzConfigurationIntegrityAgentless agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='aws-s3'>
									<WzConfigurationIntegrityAmazonS3 agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='edit-configuration'>
									<WzConfigurationEditConfiguration agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
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
