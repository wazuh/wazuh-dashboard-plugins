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
import { IsLoadingData, ChangeAnalyzerStatus, ReloadFilesData, NidsShowFile } from '../../../../redux/actions/nidsActions';
import { AppNavigate } from '../../../../react-services/app-navigate';

export const AnalyzerTable = () => {
  const dispatch = useDispatch();
  const analyzer = useSelector(state => state.nidsReducers.analyzer);
  const loadingData = useSelector(state => state.nidsReducers.loadingData);
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);

  const [plugin, setPlugin] = useState([])

  useEffect(() => {
    if (analyzer.status == "Enabled") { analyzer.currentStatus = "ON" }
    if (analyzer.status == "Disabled") { analyzer.currentStatus = "OFF" }

    if (analyzer.size <= 0) { analyzer.size = "0 Bytes" }
    else if (analyzer.size > 0 && analyzer.size < 1024) { analyzer.size = parseFloat(analyzer.size).toFixed(2) + " Bytes" }
    else if (analyzer.size >= 1024 && analyzer.size < 1048576) { analyzer.size = parseFloat(analyzer.size / 1024).toFixed(2) + " KB" }
    else if (analyzer.size >= 1048576 && analyzer.size < 1073741824) { analyzer.size = parseFloat(analyzer.size / 1048576).toFixed(2) + " MB" }
    else if (analyzer.size >= 1073741824) { analyzer.size = parseFloat(analyzer.size / 1073741824).toFixed(2) + " GB" }

    setPlugin(analyzer)
  }, []);

  useEffect(() => {
    if (analyzer.status == "Enabled") { analyzer.currentStatus = "ON" }
    if (analyzer.status == "Disabled") { analyzer.currentStatus = "OFF" }

    if (analyzer.size <= 0) { analyzer.size = "0 Bytes" }
    else if (analyzer.size > 0 && analyzer.size < 1024) { analyzer.size = parseFloat(analyzer.size).toFixed(2) + " Bytes" }
    else if (analyzer.size >= 1024 && analyzer.size < 1048576) { analyzer.size = parseFloat(analyzer.size / 1024).toFixed(2) + " KB" }
    else if (analyzer.size >= 1048576 && analyzer.size < 1073741824) { analyzer.size = parseFloat(analyzer.size / 1048576).toFixed(2) + " MB" }
    else if (analyzer.size >= 1073741824) { analyzer.size = parseFloat(analyzer.size / 1073741824).toFixed(2) + " GB" }

    setPlugin(analyzer)
  }, [analyzer]);

  const title = headRender();

  function headRender() {
    return (
      <div>
        <EuiFlexGroup>

          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                  <h2>Analyzer</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          {
            analyzer.status == "Enabled"
              ?
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="stop"
                  onClick={ev => {
                    dispatch(IsLoadingData(true));
                    dispatch(ChangeAnalyzerStatus({ uuid: nodeDetail.uuid, status: "Disabled" }));
                  }}
                >
                  Stop
                </EuiButtonEmpty>
              </EuiFlexItem>
              :
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="play"
                  onClick={ev => {
                    dispatch(IsLoadingData(true));
                    dispatch(ChangeAnalyzerStatus({ uuid: nodeDetail.uuid, status: "Enabled" }));
                  }}
                >
                  Play
                </EuiButtonEmpty>
              </EuiFlexItem>
          }

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="documentEdit"
              onClick={ev => {
                dispatch(NidsShowFile({ type: "analyzer" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}
            >
              Edit analyzer
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
        field: 'path',
        name: 'File',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'size',
        name: 'Size',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'currentStatus',
        name: 'Status',
        // width: '15%',
        // truncateText: true,
        sortable: true,
        render: item => {
          if (item == "OFF") {
            return <EuiHealth color="danger">OFF</EuiHealth>
          } else {
            return <EuiHealth color="success">ON</EuiHealth>
          }
        }
      },
      {
        field: '',
        name: 'Actions',
        width: '20%',
        render: data => actionButtonsRender(data)
      }
    ];
  }


  function actionButtonsRender(data) {
    return (
      <div className={'icon-box-action'}>
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiToolTip content="Reload analyzer information" position="left">
            <EuiButtonIcon
              onClick={ev => {
                dispatch(ReloadFilesData(nodeDetail.uuid))
              }}
              iconType="refresh"
              color={'primary'}
              aria-label="Reload analyzer information"
            />
          </EuiToolTip>

          <EuiToolTip content="View alerts file" position="left">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={ev => {
                dispatch(NidsShowFile({ type: "alerts.json", path: analyzer.path, lines: "10" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}>10</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiToolTip>

          <EuiToolTip content="View alerts file" position="left">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={ev => {
                dispatch(NidsShowFile({ type: "alerts.json", path: analyzer.path, lines: "50" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}>50</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiToolTip>

          <EuiToolTip content="View alerts file" position="left">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={ev => {
                dispatch(NidsShowFile({ type: "alerts.json", path: analyzer.path, lines: "100" }))
                AppNavigate.navigateToModule(ev, 'nids-files', {})
              }}>100</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiToolTip>

        </EuiFlexGroup>
      </div>
    );
  }

  return (
    <div>
      <br />
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="m">
        {title}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiBasicTable
              items={[plugin]}
              itemId="uuid"
              columns={columns()}
              loading={loadingData}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  )
}
