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
import { IsLoadingData, toggleWazuhFile, addWazuhFile } from '../../../../redux/actions/nidsActions';

export const AddWazuhFile = () => {
  const dispatch = useDispatch();
  const editPlugin = useSelector(state => state.nidsReducers.editPlugin);
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
  const wazuhFiles = useSelector(state => state.nidsReducers.wazuhFiles);

  const [newPath, setNewPath] = useState("")

  const AddFile = () => {
    var plug = [];
    [...Object.keys(wazuhFiles).map((item) => {
      plug.push(wazuhFiles[item]["path"])
    })];
    plug.push(newPath)

    dispatch(addWazuhFile({ uuid: nodeDetail.uuid, paths: plug }))
    dispatch(IsLoadingData(true));
  }

  const handleChangeEdit = (event) => {
    setNewPath(event.target.value)
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
              <h2>Add Wazuh file</h2>
            </EuiTitle>
            {/* </EuiFlexItem> */}
            {/* </EuiFlexGroup> */}
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="cross"
              onClick={() => {
                dispatch(toggleWazuhFile(false));
              }}
            >
              Close
						</EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Path">
              <EuiFieldText value={newPath.path} name="path" aria-label="Path" onChange={handleChangeEdit} />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow>
              <EuiButton onClick={() => { 
                dispatch(toggleWazuhFile(false));
                AddFile();
               }}>Add</EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>


      </EuiPanel>
    </div>
  )
}
