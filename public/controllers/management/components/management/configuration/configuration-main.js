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

import React, { Component, Fragment } from 'react';

import WzReduxProvider from '../../../../../redux/wz-redux-provider';
import WzConfigurationOverview from './configuration-overview';
import { WzConfigurationGlobalConfigurationManager, WzConfigurationGlobalConfigurationAgent } from './global-configuration/global-configuration';
import WzConfigurationEditConfiguration from './edit-configuration/edit-configuration';
import WzConfigurationRegistrationService from './registration-service/registration-service';
import WzConfigurationCluster from './cluster/cluster';
import WzConfigurationAlerts from './alerts/alerts';
import WzConfigurationClient from './client/client';
import WzConfigurationClientBuffer from './client-buffer/client-buffer';
import { WzConfigurationAlertsLabelsAgent } from './alerts/alerts-labels';
import WzConfigurationIntegrations from './integrations/integrations';
import WzConfigurationPolicyMonitoring from './policy-monitoring/policy-monitoring';
import WzConfigurationOpenSCAP from './open-scap/open-scap';
import WzConfigurationCisCat from './cis-cat/cis-cat';
import WzConfigurationVulnerabilities from './vulnerabilities/vulnerabilities';
import WzConfigurationOsquery from './osquery/osquery';
import WzConfigurationInventory from './inventory/inventory';
import WzConfigurationActiveResponse from './active-response/active-response';
import WzConfigurationActiveResponseAgent from './active-response/active-response-agent';
import WzConfigurationCommands from './commands/commands';
import WzConfigurationDockerListener from './docker-listener/docker-listener';
import WzConfigurationLogCollection from './log-collection/log-collection';
import WzConfigurationIntegrityMonitoring from './integrity-monitoring/integrity-monitoring';
import WzConfigurationIntegrityAgentless from './agentless/agentless';
import WzConfigurationIntegrityAmazonS3 from './aws-s3/aws-s3';
import WzViewSelector from './util-components/view-selector';
import WzConfigurationPath from './util-components/configuration-path';

import ToastProvider from './util-providers/toast-provider';
import WzToastProvider from './util-providers/toast-p';

import {
	EuiPage,
	EuiPanel,
	EuiSpacer,
	EuiButtonEmpty
} from "@elastic/eui";

import { agentIsSynchronized } from './utils/wz-fetch';

class WzConfigurationMain extends Component{
	constructor(props){
			super(props);
			this.state = {
				view: '',
				viewProps: {},
				agentSynchronized: undefined
			};
	}
	updateConfigurationSection = (view, title, description) => {
		this.setState({ view, viewProps: {title: title, description} });
	}
	updateBadge = (badgeStatus = false) => {
		this.setState({ viewProps: { ...this.state.viewProps, badge: badgeStatus}})
	}
	async componentDidMount(){
		// If agent, check if is synchronized or not
		if(this.props.agent.id !== '000'){
			try{
				const agentSynchronized = await agentIsSynchronized(this.props.agent);
				this.setState({ agentSynchronized });
			}catch(error){
				console.log(error);
			}
		}
	}
	render(){
		const { view, viewProps: {title, description, badge}, agentSynchronized } = this.state;
		const { agent, goGroups } = this.props; // goGroups and exportConfiguration is used for Manager and depends of AngularJS
		return (
			<WzReduxProvider>
				<WzToastProvider>
					<EuiPage>
						<EuiPanel>
							{agent.id !== '000' && agent.group && agent.group.length ? (
								<Fragment>
									<span>Groups:</span>
									{agent.group.map((group, key) => (
										<EuiButtonEmpty key={`agent-group-${key}`} onClick={() => goGroups(agent, key)}>{group}</EuiButtonEmpty>
									))}
									<EuiSpacer size='s'/>
									<span></span>
								</Fragment>
							) : null}
							{view !== '' && (<WzConfigurationPath title={title} description={description} updateConfigurationSection={this.updateConfigurationSection} badge={badge}/>)}
							<WzViewSelector view={view}>
								<div default>
									<WzConfigurationOverview agent={agent} agentSynchronized={agentSynchronized} exportConfiguration={this.props.exportConfiguration} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='global-configuration'>
									<WzConfigurationGlobalConfigurationManager agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='global-configuration-agent'>
									<WzConfigurationGlobalConfigurationAgent agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
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
								<div view='client'>
									<WzConfigurationClient agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='client-buffer'>
									<WzConfigurationClientBuffer agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='alerts-agent'>
									<WzConfigurationAlertsLabelsAgent agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='integrations'>
									<WzConfigurationIntegrations agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='policy-monitoring'>
									<WzConfigurationPolicyMonitoring agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='open-scap'>
									<WzConfigurationOpenSCAP agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='cis-cat'>
									<WzConfigurationCisCat agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
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
								<div view='active-response-agent'>
									<WzConfigurationActiveResponseAgent agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='commands'>
									<WzConfigurationCommands agent={agent} updateConfigurationSection={this.updateConfigurationSection}/>
								</div>
								<div view='docker-listener'>
									<WzConfigurationDockerListener agent={agent} updateBadge={this.updateBadge} updateConfigurationSection={this.updateConfigurationSection}/>
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
					</EuiPage>
				</WzToastProvider>
			</WzReduxProvider>
		)
	}
}


export default WzConfigurationMain;
