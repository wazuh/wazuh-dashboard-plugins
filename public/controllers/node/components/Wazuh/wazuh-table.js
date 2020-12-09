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
  EuiFormRow,
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
import { AddWazuhFile } from './add-wazuh-file';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { IsLoadingData, PingWazuhFiles, NidsShowFile, deleteWazuhFile, toggleWazuhFile } from '../../../../redux/actions/nidsActions';
import { StopWazuh, RunWazuh } from '../../../../redux/actions/nidsActions';
import { AppNavigate } from '../../../../react-services/app-navigate';
import { path } from 'd3';

export const WazuhTable = withReduxProvider(() => {
  const dispatch = useDispatch();
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
  const wazuhFiles = useSelector(state => state.nidsReducers.wazuhFiles);
  const wazuhData = useSelector(state => state.nidsReducers.wazuhData);
  const loadingData = useSelector(state => state.nidsReducers.loadingData);
  const toggleAddWazuhFile = useSelector(state => state.nidsReducers.toggleAddWazuhFile);

  const [plugins, setPlugins] = useState([])

  useEffect(() => {
    dispatch(IsLoadingData(true));
    getPlugin()
  }, []);

  useEffect(() => {
    dispatch(IsLoadingData(true));
    getPlugin()
  }, [wazuhFiles]);

  useEffect(() => {
    dispatch(IsLoadingData(true));
    getPlugin()
  }, [wazuhData]);

  const title = headRender();

  function getPlugin() {
    var plug = [];
    [...Object.keys(wazuhFiles).map((item) => {
      if (wazuhFiles[item]["size"] == "-1") {
        wazuhFiles[item]["size"] = "no file"
      } else {
        //file size 
        if (wazuhFiles[item]["size"] <= 0) { wazuhFiles[item]["size"] = "0 Bytes" }
        else if (wazuhFiles[item]["size"] > 0 && wazuhFiles[item]["size"] < 1024) { wazuhFiles[item]["size"] = parseFloat(wazuhFiles[item]["size"]).toFixed(2) + " Bytes" }
        else if (wazuhFiles[item]["size"] >= 1024 && wazuhFiles[item]["size"] < 1048576) { wazuhFiles[item]["size"] = parseFloat(wazuhFiles[item]["size"] / 1024).toFixed(2) + " KB" }
        else if (wazuhFiles[item]["size"] >= 1048576 && wazuhFiles[item]["size"] < 1073741824) { wazuhFiles[item]["size"] = parseFloat(wazuhFiles[item]["size"] / 1048576).toFixed(2) + " MB" }
        else if (wazuhFiles[item]["size"] >= 1073741824) { wazuhFiles[item]["size"] = parseFloat(wazuhFiles[item]["size"] / 1073741824).toFixed(2) + " GB" }
      }
      plug.push(formatNode(wazuhFiles[item]))
    })];

    setPlugins(plug)
    dispatch(IsLoadingData(false));
  }

  function formatNode(plugin) {
    return {
      ...plugin,
      actions: plugin
    };
  }

  function deleteFile(file) {

    var newFileList = [];
    [...Object.keys(wazuhFiles).map((item) => {
      if (wazuhFiles[item]["path"] != file.service.path) {
        newFileList.push(wazuhFiles[item]["path"])
      }
    })];
    return newFileList;
  }

  function headRender() {
    return (
      <div>
        <EuiFlexGroup>
          {/* <EuiFormRow> */}
          {/* <EuiFlexGroup gutterSize="s" alignItems="center"> */}
          <EuiFlexItem>
            {/* title */}
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                  <h2>Wazuh </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* status */}
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                  {
                    wazuhData.bin
                      ?
                      (
                        wazuhData.running
                          ?
                          <EuiHealth color='success'><h5>ON</h5></EuiHealth>
                          :
                          <EuiHealth color='danger'><h5>OFF</h5></EuiHealth>
                      )
                      :
                      <EuiHealth color='dark'><h5>N/A</h5></EuiHealth>
                  }
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          {/* </EuiFlexGroup> */}

          {/* </EuiFormRow> */}

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType = {wazuhData.running ? "stop" : "play"}
              onClick={() => {
                { wazuhData.running ? dispatch(StopWazuh(nodeDetail.uuid)) : dispatch(RunWazuh(nodeDetail.uuid)) }

              }}
            >
              {wazuhData.running ? "Stop" : "Play"}
              </EuiButtonEmpty>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="plusInCircle"
              onClick={() => {
                dispatch(toggleWazuhFile(true))
              }}
            >
              Add file
                </EuiButtonEmpty>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="refresh"
              onClick={() => {
                dispatch(IsLoadingData(true))
                dispatch(PingWazuhFiles(nodeDetail.uuid))
              }}
            >
              Reload Wazuh
                </EuiButtonEmpty>
          </EuiFlexItem>


          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="documentEdit"
              onClick={ev => {
                dispatch(NidsShowFile({ type: "ossec.conf", path: "/var/ossec/etc/ossec.conf", lines: "none" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}
            >
              Edit main Wazuh config file
                </EuiButtonEmpty>
          </EuiFlexItem>

        </EuiFlexGroup>
        <EuiSpacer size="xs" />
      </div >
    );
  }


  function columns() {
    return [
      {
        field: 'path',
        name: 'Path',
        sortable: true,
        // width: '20%',
        // truncateText: true
      },
      {
        field: 'size',
        name: 'Status',
        // width: '15%',
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

  function actionButtonsRender(data) {
    return (
      <div className={'icon-box-action'}>
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiToolTip content="View alerts file" position="left">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={ev => {
                dispatch(NidsShowFile({ type: "Wazuh file: " + data.path, path: data.path, lines: "10" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}>10</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiToolTip>

          <EuiToolTip content="View alerts file" position="left">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={ev => {
                dispatch(NidsShowFile({ type: "Wazuh file: " + data.path, path: data.path, lines: "50" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}>50</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiToolTip>

          <EuiToolTip content="View alerts file" position="left">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={ev => {
                dispatch(NidsShowFile({ type: "Wazuh file: " + data.path, path: data.path, lines: "100" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}>100</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiToolTip>

          <EuiToolTip content="Delete file" position="left">
            <EuiButtonIcon
              onClick={ev => {
                var listData = deleteFile({ uuid: nodeDetail.uuid, service: data })
                dispatch(deleteWazuhFile({ uuid: nodeDetail.uuid, paths: listData }))
              }}
              iconType="trash"
              color={'danger'}
              aria-label="Label Delete file"
            />
          </EuiToolTip>
        </EuiFlexGroup>
      </div>
    );
  }

  return (
    <div>
      <br />
      {toggleAddWazuhFile ? <AddWazuhFile></AddWazuhFile> : null}
      <br />
      {/* {toggleSuricata ? <AddSuricata></AddSuricata> : null}       */}
      <br />
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="m">
        {title}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiBasicTable
              items={plugins}
              itemId="uuid"
              columns={columns()}
              loading={loadingData}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  )
});