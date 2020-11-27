import React, { Component, Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
	EuiCard,
	EuiIcon,
	EuiPanel,
	EuiFlexItem,
	EuiFlexGroup,
	EuiSpacer,
	EuiText,
	EuiFlexGrid,
	EuiButtonEmpty,
	EuiTitle,
	EuiHealth,
	EuiHorizontalRule,
	EuiPage,
	EuiButton,
	EuiPopover,
	WzTextWithTooltipIfTruncated,
	EuiSelect,
	EuiLoadingChart,
	EuiBasicTable,
	WzButtonPermissions,
	EuiCodeEditor,
	EuiToolTip,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiPageBody
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { AppNavigate } from '../../../react-services/app-navigate';
import { IsLoadingData, getFile, NidsSaveFile, LoadFileLastLines } from '../../../redux/actions/nidsActions';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import { arrayAuthAnswer } from '../../../../server/lib/generate-alerts/sample-data/gcp';

export const NidsFiles = withReduxProvider(() => {
	const dispatch = useDispatch();
	const file = useSelector(state => state.nidsReducers.file);
	const fileContent = useSelector(state => state.nidsReducers.fileContent);
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);

	const [newFileContent, setFileContent] = useState('');

	const title = headRender();

	useEffect(() => {		
		if(file.type=="alerts.json"){
			dispatch(IsLoadingData(true))
			dispatch(LoadFileLastLines({ uuid:nodeDetail.uuid, number:file.lines, path:file.path }))
		}else{
			dispatch(IsLoadingData(true))
			dispatch(getFile({ uuid: nodeDetail.uuid, file: file.type }))
		}
	}, []);
	
	useEffect(() => {
		setFileContent(fileContent.fileContent || '')
	}, [fileContent]);


	function headRender() {
		return (
			<div>
				<EuiFlexGroup>

					<EuiFlexItem>
						<EuiFlexGroup>
							<EuiFlexItem>
								<EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
									<h2>File: {file.type}</h2>
								</EuiTitle>
							</EuiFlexItem>
						</EuiFlexGroup>
					</EuiFlexItem>


					{
						file.type != "alerts.json"
						?
						<EuiFlexItem grow={false}>
							<EuiButtonEmpty iconType="save" onClick={ev => {
								dispatch(NidsSaveFile({ uuid: nodeDetail.uuid, file: file.type, content: newFileContent }))
								AppNavigate.navigateToModule(ev, 'node', {})
							}}>
								Save
							</EuiButtonEmpty>
						</EuiFlexItem>
						:
						null
					}


					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="sortLeft" onClick={ev => {
							AppNavigate.navigateToModule(ev, 'node', {})
						}}>
							Back
						</EuiButtonEmpty>
					</EuiFlexItem>

				</EuiFlexGroup>
				<EuiSpacer size="xs" />
			</div>
		);
	}

	const onChange = (data) => {
		setFileContent(data);
	};

	return (
		<Fragment>
			
			<EuiPage>
				<EuiSpacer size="m" />
				<EuiPanel paddingSize="m">
					{title}
				</EuiPanel>				
			</EuiPage>

			<EuiSpacer size="m" />

			<EuiPage>
				<EuiPanel paddingSize="m">
					<EuiCodeEditor
						// mode="javascript"
						theme="github"
						width="100%"
						value={newFileContent}
						onChange={onChange}
						setOptions={{
							fontSize: '14px',
							//   enableBasicAutocompletion: true,
							//   enableSnippets: true,
							//   enableLiveAutocompletion: true,
						}}
						// onBlur={() => {}}
						aria-label="Zeek file"
					/>					
				</EuiPanel>
			</EuiPage>

		</Fragment>
	)
});
