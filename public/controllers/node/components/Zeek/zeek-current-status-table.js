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
	EuiSwitch,
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
import { LaunchZeekMainConf, PingZeek, IsLoadingData, ZeekDiag } from '../../../../redux/actions/nidsActions';
import { ChangeMainServiceStatus, GetMainconfData } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';

export const ZeekCurrentStatusTable = () => {
	const dispatch = useDispatch();
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
	const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);
	const zeekData = useSelector(state => state.nidsReducers.zeekData);
	const loadingData = useSelector(state => state.nidsReducers.loadingData);
	const mainServiceStatus = useSelector(state => state.nidsReducers.mainServiceStatus);
	const mainConfData = useSelector(state => state.nidsReducers.mainConfData);

	const [plugins, setPlugins] = useState([])

	const title = headRender();

	useEffect(() => {
		console.log(mainConfData);
		formatZeek(zeekData)
	}, []);

	useEffect(() => {
		dispatch(GetMainconfData(nodeDetail.uuid));
		dispatch(PingZeek());
	}, [mainServiceStatus]);

	function formatZeek(zeekData) {
		var data = []
		data.push({ ...zeekData, actions: zeekData })
		setPlugins(data)
	}

	const onChangeSwitch = (e) => {
		var newStatus;
		{ mainConfData["zeek"]["status"] == "enabled" ? newStatus = "disabled" : newStatus = "enabled" }

		var data = {
			uuid: nodeDetail.uuid,
			param: 'status',
			service: 'zeek',
			status: newStatus
		}
		dispatch(IsLoadingData(true));
		dispatch(ChangeMainServiceStatus(data));
	};

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
						<EuiFlexGroup>
							<EuiFlexItem>
								<EuiSwitch
									label={mainConfData["zeek"]["status"] == "enabled" ? "Zeek is enabled!" : "Zeek is disabled!"}
									checked={mainConfData["zeek"]["status"] == "enabled" ? true : false}
									onChange={(e) => onChangeSwitch(e)}
								/>
							</EuiFlexItem>
						</EuiFlexGroup>
					</EuiFlexItem>


					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="stop" onClick={() => { dispatch(IsLoadingData(true)); dispatch(LaunchZeekMainConf({ uuid: nodeDetail.uuid, param: "stop" })) }}>
							Stop
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="play" onClick={() => { dispatch(IsLoadingData(true)); dispatch(LaunchZeekMainConf({ uuid: nodeDetail.uuid, param: "start" })) }}>
							Start
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="importAction" onClick={() => { dispatch(IsLoadingData(true)); dispatch(LaunchZeekMainConf({ uuid: nodeDetail.uuid, param: "deploy" })) }}>
							Deploy
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="refresh" onClick={() => { dispatch(IsLoadingData(true)); dispatch(PingZeek(nodeDetail.uuid)) }}>
							Refresh status
						</EuiButtonEmpty>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty iconType="stats" onClick={() => { dispatch(IsLoadingData(true)); dispatch(ZeekDiag(nodeDetail.uuid)) }}>
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
							loading={loadingData}
						/>
					</EuiFlexItem>
				</EuiFlexGroup>
			</EuiPanel>
		</div>
	)
}
