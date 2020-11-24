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

// export const AddSuricata = withReduxProvider(() => {
export const AddSuricata = () => {
	const dispatch = useDispatch();
	const editPlugin = useSelector(state => state.nidsReducers.editPlugin);
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
	const interfaces = useSelector(state => state.nidsReducers.interfaces);
	const rulesets = useSelector(state => state.nidsReducers.rulesets);

	const [formatInterfaces, setFormatInterfaces] = useState([])
	const [formatRulesets, setFormatRulesets] = useState([])
	const [newSuricata, setNewSuricata] = useState({
		uuid: "",
		service: "",
		type: "",
		name: "",
		configFile: "",
		rulesetName: "",
		ruleset: "",
		interface: "",
		bpf: "",
		bpfFile: ""
	})

	useEffect(() => {
		//create interface array
		var ifaces = []
		Object.entries(interfaces || {}).map((id) => {
			ifaces.push({ value: id[0], text: id[0] })
		})
		setFormatInterfaces(ifaces);

		//create rulesets array
		var rsets = []
		Object.entries(rulesets || {}).map((id) => {
			rsets.push({ value: id[0], text: id[1].name })
		})
		setFormatRulesets(rsets);

		if (Object.entries(editPlugin).length !== 0) {
			setNewSuricata({
				uuid: nodeDetail.uuid,
				service: editPlugin.service,
				type: editPlugin.type,
				name: editPlugin.name,
				configFile: editPlugin.configFile,
				rulesetName: editPlugin.rulesetName,
				ruleset: editPlugin.ruleset,
				interface: editPlugin.interface,
				bpf: editPlugin.bpf,
				bpfFile: editPlugin.bpfFile,
			})
		}
	}, []);

	const handleChangeEdit = (event) => {
		setNewSuricata({
			...newSuricata,
			[event.target.name]: event.target.value
		})
	}

	const handleAddRequest = () => {
		//get ruleset name by their uuid
		Object.entries(rulesets || {}).map((id) => {
			if (id[0] == newSuricata.rulesetName) {
				newSuricata.ruleset = id[0]
				newSuricata.rulesetName = id[1].name
			}
		})

		newSuricata.type="suricata"
		newSuricata.uuid=nodeDetail.uuid
		
		dispatch(toggleAddSuricata(false));
		dispatch(addService(newSuricata));
	}

	const handleEditRequest = () => {
		Object.entries(rulesets || {}).map((id) => {
			if (id[0] == newSuricata.rulesetName) {
				newSuricata.ruleset = id[0]
				newSuricata.rulesetName = id[1].name
			}
		})
		dispatch(toggleAddSuricata(false));
		dispatch(updateService(newSuricata));
	}

	return (
		
		<div>
			<EuiPanel paddingSize="m">
				{/* Header */}
				<EuiFlexGroup>
					<EuiFlexItem>
						{/* <EuiFlexGroup> */}
							{/* <EuiFlexItem> */}
								<EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
									{
										Object.entries(editPlugin).length !== 0 ?
										<h2>Edit Suricata</h2> :
										<h2>Add Suricata</h2>
									}
								</EuiTitle>
							{/* </EuiFlexItem> */}
						{/* </EuiFlexGroup> */}
					</EuiFlexItem>
					<EuiFlexItem grow={false}>
						<EuiButtonEmpty
							iconType="cross"
							onClick={() => {
								dispatch(savePluginToEdit({}));
								dispatch(toggleAddSuricata(false));
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
							<EuiFieldText value={newSuricata.name} name="name" aria-label="Description" onChange={handleChangeEdit} />
						</EuiFormRow>
					</EuiFlexItem>
					<EuiFlexItem>
						<EuiFormRow label="Configuration file">
							<EuiFieldText value={newSuricata.configFile} name="configFile" aria-label="Configuration file" onChange={handleChangeEdit} />
						</EuiFormRow>
					</EuiFlexItem>
				</EuiFlexGroup>

				{/* Third row */}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiFormRow label="Ruleset">
							<EuiSelect
								hasNoInitialSelection
								name="rulesetName"
								onChange={handleChangeEdit}
								options={formatRulesets}
							/>

						</EuiFormRow>
					</EuiFlexItem>
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
				</EuiFlexGroup>

				{/* Fourth row */}
				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiFormRow label="BPF">
							<EuiFieldText value={newSuricata.bpf} name="bpf" aria-label="BPF" onChange={handleChangeEdit || ''} />
						</EuiFormRow>
					</EuiFlexItem>
					<EuiFlexItem>
						<EuiFormRow label="BPF file">
							<EuiFieldText value={newSuricata.bpfFile} name="bpfFile" aria-label="BPF file" onChange={handleChangeEdit || ''} />
						</EuiFormRow>
					</EuiFlexItem>
				</EuiFlexGroup>

				<EuiFlexGroup>
					<EuiFlexItem>
						<EuiFormRow>
							{
								Object.entries(editPlugin).length !== 0 ?
								<EuiButton onClick={() => { dispatch(IsLoadingData(true)); dispatch(toggleAddSuricata(false)); handleEditRequest() }}>Edit</EuiButton> :
								<EuiButton onClick={() => { dispatch(IsLoadingData(true)); dispatch(toggleAddSuricata(false)); handleAddRequest() }}>Add</EuiButton>
							}
						</EuiFormRow>
					</EuiFlexItem>
				</EuiFlexGroup>

			</EuiPanel>
			
		</div>
	)
}