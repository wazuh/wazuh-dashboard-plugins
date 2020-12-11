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
import { toggleAddSuricata, savePluginToEdit, deleteService, syncRuleset, IsLoadingData, changeServiceStatus, NidsShowFile } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';
import { AppNavigate } from '../../../../react-services/app-navigate';

import { SocketToNewtwork } from './socket-to-network';
// import { NetworkToPcap } from './socket-to-network';
import { SocketToPcap } from './socket-to-pcap';
import { NetworkToSocket } from './network-to-socket';
import { AddNetworkToSocket } from './add-network-to-socket';
import { AddSocketToNewtwork } from './add-socket-to-network';
import { AddSocketToPcap } from './add-socket-to-pcap';

export const StapTables = () => {
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
	const showSocNet = useSelector(state => state.nidsReducers.showSocNet);
	const showSocPcap = useSelector(state => state.nidsReducers.showSocPcap);
	const showNetSoc = useSelector(state => state.nidsReducers.showNetSoc);
	const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);

	function IsInstalled() {
		if (nodePlugins["installed"]["checkSocat"] == "false" || nodePlugins["installed"]["checkTcpdump"] == "false" || nodePlugins["installed"]["checkTcpreplay"] == false) {
			return <div>
				<EuiSpacer size="m" />
				<EuiPanel paddingSize="m">
					<EuiFlexGroup>

						<EuiFlexGroup>
							<EuiFlexItem>
								{
									nodePlugins["installed"]["checkSocat"] == "true"
										?
										<EuiHealth color='success'><h3>Socat: <b>Installed</b></h3></EuiHealth>
										:
										<EuiHealth color='danger'><h3>Socat: <b>Not Installed</b></h3></EuiHealth>
								}
							</EuiFlexItem>
						</EuiFlexGroup>
						<EuiFlexGroup>
							<EuiFlexItem>
								{
									nodePlugins["installed"]["checkTcpdump"] == "true"
										?
										<EuiHealth color='success'><h3>Tcpdump: <b>Installed</b></h3></EuiHealth>
										:
										<EuiHealth color='danger'><h3>Tcpdump: <b>Not Installed</b></h3></EuiHealth>
								}
							</EuiFlexItem>
						</EuiFlexGroup>
						<EuiFlexGroup>
							<EuiFlexItem>
								{
									nodePlugins["installed"]["checkTcpreplay"] == "true"
										?
										<EuiHealth color='success'><h3>Tcpreplay: <b>Installed</b></h3></EuiHealth>
										:
										<EuiHealth color='danger'><h3>Tcpreplay: <b>Not Installed</b></h3></EuiHealth>
								}
							</EuiFlexItem>
						</EuiFlexGroup>
					</EuiFlexGroup>
				</EuiPanel>
			</div>
		}
	}

	return (
		<div>
			{IsInstalled()}
			{showSocNet != '' ? <AddSocketToNewtwork></AddSocketToNewtwork> : null}
			<br />
			<SocketToNewtwork></SocketToNewtwork>
			<br />
			{showSocPcap != '' ? <AddSocketToPcap></AddSocketToPcap> : null}
			<br />
			<SocketToPcap></SocketToPcap>
			<br />
			{showNetSoc != '' ? <AddNetworkToSocket></AddNetworkToSocket> : null}
			<br />
			<NetworkToSocket></NetworkToSocket>
			<br />
			{/* <NetworkToPcap></NetworkToPcap> */}
		</div>
	)
}
