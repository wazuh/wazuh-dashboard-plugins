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
	EuiFormRow,
	EuiLoadingChart,
	EuiBasicTable,
	EuiFieldText,
	EuiToolTip,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiPageBody
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { toggleAddSuricata, savePluginToEdit, updateService, addService, IsLoadingData } from '../../../../redux/actions/nidsActions';
import { AddSocketToNetwork } from './add-socket-to-network'

export const SocketToNetwork = () => {
	const dispatch = useDispatch();
	const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);

	const title = headRender();

	useEffect(() => { 
		// dispatch(IsLoadingData(true));
		console.log(nodePlugins);
	}, []);

	function headRender() {
		return (
			<div>
				<EuiFlexGroup>

					<EuiFlexItem>
						<EuiFlexGroup>
							<EuiFlexItem>
								<EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
									<h2>Socket->Network table </h2>
								</EuiTitle>
							</EuiFlexItem>
						</EuiFlexGroup>
					</EuiFlexItem>

					<EuiFlexItem grow={false}>
						<EuiButtonEmpty
							iconType="plusInCircle"
							onClick={() => {  }}
						>
							Add Socket->Network
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
        field: 'desc',
        name: 'Description',
        sortable: true,
        // width: '20%',
        // truncateText: true
      },
      {
        field: 'port',
        name: 'Port',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'cert',
        name: 'Certificate',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'interface',
        name: 'Interface',
        // width: '10%',
        // truncateText: true,
        sortable: true
      },     
      {
        field: 'actions',
        name: 'Actions',
        width: '15%',
        render: data => actionButtonsRender(data)
      }
    ];
  }





	return (
		
		<div>
			<p>SOCKET TO NET</p>
			{/* <br />
			{toggleSocketToNetwork ? <AddSocketToNetwork></AddSocketToNetwork> : null}
			<br />
			<EuiSpacer size="m" />
			<EuiPanel paddingSize="m">
				{title}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiBasicTable
							items={[]}
							itemId="uuid"
							columns={columns()}
							loading={false}
						/>
					</EuiFlexItem>
				</EuiFlexGroup>
			</EuiPanel> */}
		</div>
	)
}
