import React, { Fragment, Component } from 'react';

import WzReduxProvider from '../../redux/wz-redux-provider';

import {
	EuiFlexGroup,
	EuiFlexItem,
	EuiPage,
	EuiPanel,
	EuiTitle,
	EuiPageBody
} from '@elastic/eui';

import WzExtensionGuide from './extension-guide';

interface IWzExtensionGuidesState{
	guide: string
};

export default class WzExtensionsGuide extends Component<null,IWzExtensionGuidesState>{
constructor(props){
	super(props);
	this.state = {
		guide: ''
	}
	console.log('HELLO')
}
changeGuide = (guide: string = '') => {
	this.setState({ guide });
}
render(){
	const { guide } = this.state;
	return (
		<WzReduxProvider>
			<EuiPage>
				<EuiPageBody>
					{guide && (
						<WzExtensionGuide guideId={guide} closeGuide={() => this.changeGuide()}/>
					) || (
						<>
						<EuiFlexGroup>
							<EuiFlexItem>
								<EuiTitle>
									<h2>Extension Guides</h2>
								</EuiTitle>
							</EuiFlexItem>
						</EuiFlexGroup>
						<EuiFlexGroup>
							<EuiFlexItem>
								<EuiPanel onClick={() => this.changeGuide('fim')}>
									FIM
								</EuiPanel>
							</EuiFlexItem>
						</EuiFlexGroup>
						</>
					)}

				</EuiPageBody>
			</EuiPage>
		</WzReduxProvider>
	)
}
}