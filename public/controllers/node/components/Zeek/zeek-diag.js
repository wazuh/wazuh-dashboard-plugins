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
	EuiCodeEditor,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiPageBody
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { toggleAddSuricata, savePluginToEdit, deleteService, syncRuleset, changeServiceStatus } from '../../../../redux/actions/nidsActions';

export const ZeekDiagnostic = () => {
	const zeekDiag = useSelector(state => state.nidsReducers.zeekDiag);
    
    return (
		<EuiCodeEditor
			mode="less"
			theme="github"
			width="100%"
			value={zeekDiag.raw}
			setOptions={{ fontSize: '14px' }}
			isReadOnly
			aria-label="Zeek Diagnostics"
		/>
    )
}
