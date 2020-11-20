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
	EuiToolTip,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiPageBody
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { LaunchZeekMainConf, PingZeek } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';

export const ZeekCurrentStatusTable = () => {
	const dispatch = useDispatch();
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
	const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);
	const zeekData = useSelector(state => state.nidsReducers.zeekData);

	const [isLoading, setIsLoading] = useState(false)
	const [plugins, setPlugins] = useState([])
	
	const title = headRender();

	useEffect(() => { 
		formatZeek(zeekData)
	}, []);
	
	function formatZeek(zeekData) {
		var data = []
		data.push({...zeekData, actions: zeekData})
		setPlugins(data)
	}

	function headRender() {
		return (
			<div>
				<EuiFlexGroup>

					<EuiFlexItem>
						<EuiFlexGroup>
							<EuiFlexItem>
								<EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
									<h2>Zeek</h2>
								</EuiTitle>
							</EuiFlexItem>
						</EuiFlexGroup>
					</EuiFlexItem>


					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="stop" onClick={() => { dispatch(LaunchZeekMainConf({uuid: nodeDetail.uuid, param: "stop"})) }}>
							Stop
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="play" onClick={() => { dispatch(LaunchZeekMainConf({uuid: nodeDetail.uuid, param: "start"})) }}>
							Start
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="importAction" onClick={() => { dispatch(LaunchZeekMainConf({uuid: nodeDetail.uuid, param: "deploy"})) }}>
							Deploy
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="refresh" onClick={() => { dispatch(PingZeek(nodeDetail.uuid)) }}>
							Refresh status
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="stats" onClick={() => { }}>
							Diagnostics
						</EuiButtonEmpty>
					</EuiFlexItem>

				</EuiFlexGroup>
				<EuiSpacer size="xs" />
			</div>
		);
	}

	function columns() {
		return [
			{
				field: 'managername',
				name: '',
				sortable: true,
				width: '20%',
				// truncateText: true
			},
			{
				field: 'mode',
				name: '',
				// width: '15%',
				// truncateText: true,
				sortable: true
			},
		];
	}

	return (
		<div>
			<EuiSpacer size="m" />
			<EuiPanel paddingSize="m">
				{title}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiBasicTable
							items={plugins}
							itemId="uuid"
							 columns={columns()}
							loading={isLoading}
						/>
					</EuiFlexItem>
				</EuiFlexGroup>
			</EuiPanel>
		</div>
	)
}
