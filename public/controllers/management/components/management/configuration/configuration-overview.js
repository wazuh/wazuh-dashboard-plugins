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

import configurationSettingsGroup from './configuration-settings';

const columns = [
	{
		field: 'name',
		name: 'Name'
	},
	{
		field: 'description',
		name: 'Description'
	}
];

const helpLinks = [
	{ text: 'Wazuh administration documentation', href: 'https://documentation.wazuh.com/current/user-manual/manager/index.html' },
	{ text: 'Wazuh capabilities documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/index.html' },
	{ text: 'Local configuration reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/index.html' }
];

class WzConfigurationOverview extends Component{
    constructor(props){
			super(props);
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
									<WzHelpButtonPopover links={helpLinks}/>
								</EuiFlexItem>
							</EuiFlexGroup>
						</EuiFlexItem>
					</EuiFlexGroup>
					<EuiFlexGroup>
						<EuiFlexItem>
							{configurationSettingsGroup.map((group, key) => (
								<WzConfigurationOverviewTable 
									key={`settings-${group.title}`}
									title={group.title}
									columns={columns}
									items={group.settings}
									onClick={this.props.updateConfigurationSection}
								/>
							))}
						</EuiFlexItem>
					</EuiFlexGroup>
				</Fragment>
			)
    }
}

export default WzConfigurationOverview;