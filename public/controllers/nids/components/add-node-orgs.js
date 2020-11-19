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
import { saveSelectedOrgs } from '../../../redux/actions/nidsActions';
import { useSelector, useDispatch } from 'react-redux';
import { dispatch } from 'd3';

export const AddNodeOrgs = () => {
	const dispatch = useDispatch();
	const orgs = useSelector(state => state.nidsReducers.orgs);
	const [allOrgs, setOrgs] = useState([]); //set default org list
	const [selectedOptions, setSelected] = useState([]);

	useEffect(() => {
		//filter tags
		console.log(orgs);
		filterOrgs()
	}, []);

	useEffect(() => {
		//get uuid for every org name
		var orgsNameToId = []
		Object.entries(selectedOptions || {}).map((id) => {
			Object.entries(orgs || {}).map((uuid) => {
				if (uuid[1].name == id[1].label) {
					orgsNameToId.push(uuid[0])
				}
			})
		})

		dispatch(saveSelectedOrgs(orgsNameToId))
	}, [selectedOptions]);

	const onChange = (selectedOptions) => {
		setSelected(selectedOptions);
	};

	function filterOrgs() {
		var orgsFiltered = []
		Object.entries(orgs || {}).map((id) => {
			orgsFiltered.push({ label: id[1].name })
		})
		setOrgs(orgsFiltered)
	}

	return (
		<EuiFlexItem>
			<EuiFormRow label="Orgs">
				<EuiComboBox
					placeholder="Select one or more organizations"
					options={allOrgs}
					selectedOptions={selectedOptions}
					onChange={onChange}
				/>
			</EuiFormRow>
		</EuiFlexItem>
	)
}
