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

	return (
		<div>
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
