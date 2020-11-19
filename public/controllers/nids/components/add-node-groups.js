import React, { Component, Fragment, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import {
	EuiBasicTable,
	EuiButton,
	EuiButtonEmpty,
	EuiButtonIcon,
	EuiFlexGroup,
	EuiFlexItem,
	EuiPanel,
	EuiToolTip,
	EuiTitle,
	EuiHealth,
	EuiSpacer,
	EuiCallOut,
	EuiOverlayMask,
	EuiConfirmModal,
	EuiDescribedFormGroup,
	EuiFieldPassword,
	EuiLoadingSpinner,
	EuiFlexGrid,
	EuiFieldText,
	DisplayToggles,
	EuiFormRow,
	EuiComboBox,
	EuiForm
} from '@elastic/eui';
import { NidsRequest } from '../../../react-services/nids-request';
import { saveSelectedGroups } from '../../../redux/actions/nidsActions';
import { useSelector, useDispatch } from 'react-redux';

export const AddNodeGroups = () => {
	const dispatch = useDispatch();
	const groups = useSelector(state => state.nidsReducers.groups);
	const [allGroups, setGroups] = useState([]); //set default org list
	const [selectedOptions, setSelected] = useState([]);

	useEffect(() => {		
		console.log(groups);
		filterGroups()
	}, []);

	useEffect(() => {
		var orgsNameToId = []
		Object.entries(selectedOptions || {}).map((id) => {
			orgsNameToId.push(id[1].label)
		})
		dispatch(saveSelectedGroups(orgsNameToId))
	}, [selectedOptions]);

	function filterGroups() {
		var orgsFiltered = []
		Object.entries(groups || {}).map((id) => {
			orgsFiltered.push({ label: id[1].gname })
		})
		setGroups(orgsFiltered)
	}

	const onChange = (selectedOptions) => {
		setSelected(selectedOptions);
	};

	return (
		<EuiFlexItem>
			<EuiFormRow label="Groups">
				<EuiComboBox
					placeholder="Select one or more groups"
					options={allGroups}
					selectedOptions={selectedOptions}
					onChange={onChange}
				/>
			</EuiFormRow>
		</EuiFlexItem>
	)
}
