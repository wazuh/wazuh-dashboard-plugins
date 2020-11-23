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
import { AppNavigate } from '../../../react-services/app-navigate';
import { getFile } from '../../../redux/actions/nidsActions';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';

export const NidsFiles = withReduxProvider(() => {
    const dispatch = useDispatch();
    const file = useSelector(state => state.nidsReducers.file);
    const fileContent = useSelector(state => state.nidsReducers.fileContent);
    const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
    
    useEffect(() => { 
        console.log(file);
        dispatch(getFile({uuid: nodeDetail.uuid, file: file}))
    }, []);
    
    useEffect(() => { 
        console.log(fileContent);
    }, [fileContent]);
    
    return (
        <div>
            <p>{file}</p>
        </div>
    )
});
