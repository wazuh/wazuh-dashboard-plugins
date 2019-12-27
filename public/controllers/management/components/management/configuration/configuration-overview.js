import React, { Component, Fragment } from 'react';

import {
	EuiPage,
	EuiPanel,
	EuiTitle,
	EuiFlexGroup,
	EuiFlexItem,
	EuiText,
	EuiButtonEmpty,
	EuiPopover
} from '@elastic/eui';

import { connect } from 'react-redux';

import WzConfigurationOverviewTable from './configuration-overview-table';
import WzHelpButtonPopover from './util-components/help-button-popover';

import { updateConfigurationSection } from '../../../../../redux/actions/configurationActions';

class WzConfigurationOverview extends Component{
    constructor(props){
			super(props);

			this.columns = [
				{
					field: 'name',
					name: 'Name'
				},
				{
					field: 'description',
					name: 'Description'
				}
			];
			this.mainConfigurationsItems = [
				{
					row: {
						name: 'Global Configuration',
						description: 'Global and remote settings'
					},
					onClick: () => this.updateConfigurationSection('global-configuration')
				},
				{
					row: {
						name: 'Cluster',
						description: 'Master node configuration'
					},
					onClick: () => this.updateConfigurationSection('cluster')
				},
				{
					row: {
						name: 'Registration Service',
						description: 'Automatic agent registration service'
					},
					onClick: () => this.updateConfigurationSection('registration-service')
				}
			];
			this.alertsOutputManagementItems = [
				{
					row: {
						name: 'Alerts',
						description: 'Settings related to the alerts and their format'
					},
					onClick: () => this.updateConfigurationSection('alerts')
				},
				{
					row: {
						name: 'Integrations',
						description: 'Slack, VirusTotal and PagerDuty integrations with external APIs'
					},
					onClick: () => this.updateConfigurationSection('integrations')
				}
				
			];
			this.auditingPolicyMonitoringItems = [
				{
					row: {
						name: 'Policy monitoring',
						description: 'Configuration to ensure compliance with security policies, standards and hardening guides'
					},
					onClick: () => this.updateConfigurationSection('policy-monitoring')
				},
				{
					row: {
						name: 'CIS-CAT',
						description: 'Configuration assessment using CIS scanner and SCAP checks'
					},
					onClick: () => this.updateConfigurationSection('cis-cat') //swtichWoodle
				}
				
			];
			this.systemThreatsIncidentResponseItems = [
				{
					row: {
						name: 'Vulnerabilities',
						description: 'Discover what applications are affected by well-known vulnerabilities'
					},
					onClick: () => this.updateConfigurationSection('vulnerabilities')
				},
				{
					row: {
						name: 'Osquery',
						description: 'Expose an operating system as a high-performance relational database'
					},
					onClick: () => this.updateConfigurationSection('osquery')
				},
				{
					row: {
						name: 'Inventory data',
						description: 'Gather relevant information about system OS, hardware, networking and packages'
					},
					onClick: () => this.updateConfigurationSection('inventory')
				},
				{
					row: {
						name: 'Active Response',
						description: 'Active threat addressing by inmmediate response'
					},
					onClick: () => this.updateConfigurationSection('active-response')
				},
				{
					row: {
						name: 'Commands',
						description: 'Configuration options of the Command wodle'
					},
					onClick: () => this.updateConfigurationSection('commands')
				}
			];
			this.logDataAnalysisItems = [
				{
					row: {
						name: 'Log collection',
						description: 'Log analysis from text files, Windows events or syslog outputs'
					},
					onClick: () => this.updateConfigurationSection('log-collection')
				},
				{
					row: {
						name: 'Integrity monitoring',
						description: 'Identify changes in content, permissions, ownership, and attributes of files'
					},
					onClick: () => this.updateConfigurationSection('integrity-monitoring')
				},
				{
					row: {
						name: 'Agentless',
						description: 'Run integrity checks on devices such as routers, firewalls and switches'
					},
					onClick: () => this.updateConfigurationSection('agentless')
				}
				
			];
			this.cloudSecurityMonitoring = [
				{
					row: {
						name: 'Amazon S3',
						description: 'Security events related to Amazon AWS services, collected directly via AWS API'
					},
					onClick: () => this.updateConfigurationSection('aws-s3')
				}
			];
			this.helpLinks = [
				{ text: 'Wazuh administration documentation', href: 'https://documentation.wazuh.com/current/user-manual/manager/index.html' },
				{ text: 'Wazuh capabilities documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/index.html' },
				{ text: 'Local configuration reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/index.html' }
			];
		}
		updateConfigurationSection(section){
			this.props.updateConfigurationSection(section);
		}
    render(){
			return (
				<Fragment>
					<EuiFlexGroup>
						<EuiFlexItem>
							<EuiFlexGroup>
								<EuiFlexItem>
									<EuiTitle>
										<h2>Configuration</h2>
									</EuiTitle>
								</EuiFlexItem>
							</EuiFlexGroup>
						</EuiFlexItem>
						<EuiFlexItem grow={false}>
							<EuiFlexGroup gutterSize="xs">
								<EuiFlexItem>
									<EuiButtonEmpty iconSide="left" iconType="pencil" onClick={() => this.updateConfigurationSection('edit-configuration')}> 
										Edit configuration
									</EuiButtonEmpty>
								</EuiFlexItem>
								<EuiFlexItem>
									<WzHelpButtonPopover links={this.helpLinks}/>
								</EuiFlexItem>
							</EuiFlexGroup>
						</EuiFlexItem>
					</EuiFlexGroup>
					<EuiFlexGroup>
						<EuiFlexItem>
							<WzConfigurationOverviewTable 
								title="Main configurations"
								columns={this.columns}
								items={this.mainConfigurationsItems}
							/>
							<WzConfigurationOverviewTable 
								title="Alerts and output management"
								columns={this.columns}
								items={this.alertsOutputManagementItems}
							/>
							<WzConfigurationOverviewTable 
								title="Auditing and policy monitoring"
								columns={this.columns}
								items={this.auditingPolicyMonitoringItems}
							/>
							<WzConfigurationOverviewTable 
								title="System threats and incident response"
								columns={this.columns}
								items={this.systemThreatsIncidentResponseItems}
							/>
							<WzConfigurationOverviewTable 
								title="Alerts and output management"
								columns={this.columns}
								items={this.logDataAnalysisItems}
							/>
							<WzConfigurationOverviewTable 
								title="Cloud security monitoring"
								columns={this.columns}
								items={this.cloudSecurityMonitoring}
							/>
						</EuiFlexItem>
					</EuiFlexGroup>
				</Fragment>
			)
    }
}

export default WzConfigurationOverview;