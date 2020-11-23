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
import { LaunchZeekMainConf, PingZeek, IsLoadingData, ZeekDiag } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';
import {ZeekCurrentStatusTable} from './zeek-current-status-table'
import {ZeekStatusDetailsTable} from './zeek-status-details-table'
import {ZeekDiagnostic} from './zeek-diag'

export const ZeekTable = () => {
    const zeekDiagData = useSelector(state => state.nidsReducers.zeekDiag);
    useEffect(() => { 
        console.log(zeekDiagData != null);
	}, []);
    return (
        <div>
            <ZeekCurrentStatusTable></ZeekCurrentStatusTable>
            <br></br>
            <ZeekStatusDetailsTable></ZeekStatusDetailsTable>
            <br></br>
            {Object.entries(zeekDiagData).length !== 0 ? <ZeekDiagnostic></ZeekDiagnostic> : null}
        </div>
    )
}
