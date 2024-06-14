/*
 * Wazuh app - React component for render add modules data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import WzSampleData from './sample-data';
import modeGuides from './guides';

import { compose } from 'redux';

import { withGlobalBreadcrumb } from '../common/hocs';
import { sampleData } from '../../utils/applications';

const guides = Object.keys(modeGuides)
  .map(key => modeGuides[key])
  .sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

interface IPropsWzAddModulesData {
  close: Function;
}

interface IStateWzAddModulesData {
  guide: string;
  selectedGuideCategory: any;
}

class WzAddModulesData extends Component<
  IPropsWzAddModulesData,
  IStateWzAddModulesData
> {
  tabs: any;
  constructor(props) {
    super(props);
    // DON'T DELETE THE BELOW CODE. IT'S FOR MODULE GUIDES.
    // const categories = Object.keys(modeGuides).map(key => modeGuides[key].category).filter((value,key,array) => array.indexOf(value) === key);
    // this.tabs = [
    // 	...categories.map(category => ({
    // 		id: category,
    // 		name: category,
    // 		content: (
    // 			<Fragment>
    // 				<EuiSpacer size='m' />
    // 				<EuiFlexGrid columns={4}>
    // 					{this.getModulesFromCategory(category).map(extension => (
    // 						<EuiFlexItem key={`add-modules-data--${extension.id}`}>
    // 							<EuiCard
    // 								layout='horizontal'
    // 								icon={(<EuiIcon size='xl' type={extension.icon} />) }
    // 								title={extension.name}
    // 								description={(WAZUH_MODULES[extension.id] && WAZUH_MODULES[extension.id].description) || extension.description}
    // 								onClick={() => this.changeGuide(extension.id) }
    // 							/>
    // 						</EuiFlexItem>
    // 					))}
    // 				</EuiFlexGrid>
    // 			</Fragment>
    // 		)
    // 	})),
    // 	{
    // 		id: 'sample_data',
    // 		name: 'Sample data',
    // 		content: (
    // 			<Fragment>
    // 				<EuiSpacer size='m' />
    // 				<WzSampleData/>
    // 			</Fragment>
    // 		)
    // 	}
    // ];
    // this.state = {
    // 	guide: '',
    // 	selectedGuideCategory: window.location.href.includes('redirect=sample_data') ? this.tabs.find(tab => tab.id === 'sample_data') : this.tabs[0]
    // }
    // "redirect=sample_data" is injected into the href of the "here" button in the callout notifying of installed sample alerts
  }

  changeGuide = (guide: string = '') => {
    this.setState({ guide });
  };
  changeSelectedGuideCategory = (selectedGuideCategory: string = '') => {
    this.setState({ selectedGuideCategory });
  };
  getModulesFromCategory(category: string = '') {
    return category !== ''
      ? guides.filter(guide => guide.category === category)
      : guides;
  }
  render() {
    // const { guide, selectedGuideCategory } = this.state; // DON'T DELETE. IT'S FOR MODULE GUIDES.
    return (
      <EuiPage restrictWidth='1200px'>
        <EuiPageBody>
          {/** Module guides with sample data rendered as tabs */}
          {/* {guide && (
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
											<span>Sample data</span>
										</h2>
									</EuiTitle>
								</EuiFlexItem>
							</EuiFlexGroup>
							<EuiSpacer size='m'/>
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
					)} */}
          {/* Only sample data */}
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle size='l'>
                <span>Sample data</span>
              </EuiTitle>
              <EuiText color='subdued'>Add sample data to modules.</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='m' />
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzSampleData />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

export default compose(
  withGlobalBreadcrumb(props => {
    return [{ text: sampleData.breadcrumbLabel }];
  }),
)(WzAddModulesData);
