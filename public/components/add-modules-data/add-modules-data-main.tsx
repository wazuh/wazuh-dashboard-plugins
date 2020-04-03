/*
 * Wazuh app - React component for add sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Fragment, Component } from 'react';

import {
	EuiButtonIcon,
	EuiCard,
	EuiFlexGrid,
	EuiFlexGroup,
	EuiFlexItem,
	EuiIcon,
	EuiPage,
	EuiPageBody,
	EuiSpacer,
	EuiTabbedContent,
	EuiTitle,
	EuiToolTip
} from '@elastic/eui';

import WzModuleGuide from './module-guide';
import { SampleData } from './sample-data';
import modeGuides from './guides';

import { TabDescription } from '../../../server/reporting/tab-description';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import store from '../../redux/store';

const guides = Object.keys(modeGuides).map(key => modeGuides[key]).sort((a,b) => {
	if (a.name < b.name) { return -1 }
	else if (a.name > b.name) { return 1 }
	return 0
});

interface IPropsWzAddModulesData {
	close: Function
};

interface IStateWzAddModulesData {
	guide: string
	selectedGuideCategory: string
};

export default class WzAddModulesData extends Component<IPropsWzAddModulesData, IStateWzAddModulesData>{
	tabs: any
	constructor(props){
		super(props);
		this.state = {
			guide: '',
			selectedGuideCategory: ''
		}
		
		const categories = Object.keys(modeGuides).map(key => modeGuides[key].category).filter((value,key,array) => array.indexOf(value) === key);
		this.tabs = [
			...categories.map(category => ({
				id: category,
				name: category,
				content: (
					<Fragment>
						<EuiSpacer size='m' />
						<EuiFlexGrid columns={4}>
							{this.getExtensionsFromCategory(category).map(extension => (
								<EuiFlexItem key={`add-modules-data--${extension.id}`}>
									<EuiCard
										layout='horizontal'
										icon={(<EuiIcon size='xl' type={extension.icon} />) }
										title={extension.name}
										description={(TabDescription[extension.id] && TabDescription[extension.id].description) || extension.description}
										onClick={() => this.changeGuide(extension.id) }
									/>
								</EuiFlexItem>
							))}
						</EuiFlexGrid>
					</Fragment>
				)
			})),
			{
				id: 'Sample Data',
				name: 'Sample Data',
				content: (
					<Fragment>
						<EuiSpacer size='m' />
						<SampleData/>
					</Fragment>
				)
			}
		]
	}
	setGlobalBreadcrumb() {
    const breadcrumb = [
			{ text: '' },
			{ text: 'Management', href: '/app/wazuh#/manager' },
			{ text: 'Modules' }
		];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  componentDidMount() {
    this.setGlobalBreadcrumb();
  }
	changeGuide = (guide: string = '') => {
		this.setState({ guide });
	}
	changeSelectedGuideCategory = (selectedGuideCategory: string = '') => {
		this.setState({ selectedGuideCategory });
	}
	getExtensionsFromCategory(category: string = ''){
		return category !== '' ? guides.filter(guide => guide.category === category) : guides;
	}
	render(){
		const { guide, selectedGuideCategory } = this.state;
		return (
			<EuiPage restrictWidth='1200px'>
				<EuiPageBody>
					{guide && (
						<WzModuleGuide guideId={guide} close={() => this.changeGuide('')} {...this.props}/>
						) || (
						<Fragment>
							<EuiFlexGroup>
								<EuiFlexItem>
									<EuiTitle size='l'>
										<h2>
											{this.props.close && (
												<Fragment>
													<EuiToolTip
														position='top'
														content='Back'
													>
														<EuiButtonIcon onClick={() => this.props.close()} iconType='arrowLeft' iconSize='l' aria-label='Back'/>
													</EuiToolTip>
													<span> </span>
												</Fragment>
											)}
											<span>Add modules data</span>
										</h2>
									</EuiTitle>
								</EuiFlexItem>
							</EuiFlexGroup>
							<EuiSpacer size='m' />
							<EuiFlexGroup>
								<EuiFlexItem>
									<EuiTabbedContent
										tabs={this.tabs}
										selectedTab={selectedGuideCategory}
										onTabClick={selectedTab => {
											this.changeSelectedGuideCategory(selectedTab);
										}}
									/>
								</EuiFlexItem>
							</EuiFlexGroup>
						</Fragment>
					)}
				</EuiPageBody>
			</EuiPage>
		)
	}
}