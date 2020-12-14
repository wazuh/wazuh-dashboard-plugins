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
import { toggleSocketNetwork, updateService, addStap, IsLoadingData, savePluginToEdit } from '../../../../redux/actions/nidsActions';

export const AddSocketToNewtwork = () => {
	const dispatch = useDispatch();
	const showSocNet = useSelector(state => state.nidsReducers.showSocNet);
	const interfaces = useSelector(state => state.nidsReducers.interfaces);
	const editPlugin = useSelector(state => state.nidsReducers.editPlugin);
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);

	const [formatInterfaces, setFormatInterfaces] = useState([])
	const [stapData, setStapData] = useState({
		uuid: "",
		service: "",
		connections: "",
		connectionsColor: "",
		connectionsCount: "",
		interfaz: "",
		name: "",
		pid: "",
		cert: "/usr/local/owlh/src/owlhnode/conf/certs/ca.pem",
		port: "",
		running: "",
		type: "",
	})

	useEffect(() => {
  	//create interface array
		var ifaces = []
		Object.entries(interfaces || {}).map((id) => {
			ifaces.push({ value: id[0], text: id[0] })
		})
		setFormatInterfaces(ifaces);

		if (Object.entries(editPlugin).length !== 0) {
			setStapData({
				uuid: nodeDetail.uuid,
				service: editPlugin.service,
				connections: editPlugin.connections,
				connectionsColor: editPlugin.connectionsColor,
				connectionsCount: editPlugin.connectionsCount,
				interfaz: editPlugin.interfaz,
				name: editPlugin.name,
				pid: editPlugin.pid,
				cert: editPlugin.cert,
				port: editPlugin.port,
				running: editPlugin.running,
				type: editPlugin.type,
			})
		}

	}, []);

	const handleChangeEdit = (event) => {
		setStapData({
			...stapData,
			[event.target.name]: event.target.value
		})
	}

	const handleAddRequest = () => {
		dispatch(IsLoadingData(true));
		dispatch(toggleSocketNetwork(''));
		dispatch(addStap(
			{
				uuid: nodeDetail.uuid,
				name: stapData.name,
				type: "socket-network",
				cert: stapData.cert,
				port: stapData.port,
				interface: stapData.interface,
			}
		));
	}

	const handleEditRequest = () => {
		dispatch(IsLoadingData(true));
		dispatch(toggleSocketNetwork(''));
		dispatch(updateService(
			{
				uuid: nodeDetail.uuid,
				service: stapData.service,
				type: "socket-network",
				name: stapData.name,
				port: stapData.port,
				cert: stapData.cert,
				interface: stapData.interface,
			}
		));
	}

	return (
		<div>
			<EuiPanel paddingSize="m">

				{/* Header */}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
							{
								showSocNet == 'edit' ?
								<h2>Edit Socket->Network</h2> :
								<h2>Add Socket->Network</h2>
							}
						</EuiTitle>
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty
							iconType="cross"
							onClick={() => {
								dispatch(savePluginToEdit({}))
								dispatch(toggleSocketNetwork(''))
							}}
						>
							Close
						</EuiButtonEmpty>
					</EuiFlexItem>
				</EuiFlexGroup>
				<EuiSpacer size="xs" />

				{/* Second row */}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiFormRow label="Description">
							<EuiFieldText value={stapData.name} name="name" aria-label="Description" onChange={handleChangeEdit} />
						</EuiFormRow>
					</EuiFlexItem>
					<EuiFlexItem>
						<EuiFormRow label="Port">
							<EuiFieldText value={stapData.port} name="port" aria-label="Port" onChange={handleChangeEdit} />
						</EuiFormRow>
					</EuiFlexItem>
				</EuiFlexGroup>

				{/* row */}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiFormRow label="Interface">
							<EuiSelect
								hasNoInitialSelection
								name="interface"
								onChange={handleChangeEdit}
								options={formatInterfaces}
							/>
						</EuiFormRow>
					</EuiFlexItem>
					<EuiFlexItem>
						<EuiFormRow label="Certificate">
							<EuiFieldText value={stapData.cert} name="cert" aria-label="Certificate" onChange={handleChangeEdit} />
						</EuiFormRow>
					</EuiFlexItem>
				</EuiFlexGroup>

				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiFormRow>
							{
								showSocNet == 'edit' ?
								<EuiButton onClick={() => { handleEditRequest() }}>Edit</EuiButton> :
								<EuiButton onClick={() => { handleAddRequest() }}>Add</EuiButton>
							}
						</EuiFormRow>
					</EuiFlexItem>
				</EuiFlexGroup>

			</EuiPanel>

		</div>
	)
}
