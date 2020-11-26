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

    if (analyzer.size < 1024 && analyzer.size > 0) { analyzer.size = (analyzer.size).toFixed(2) + " Bytes" }
    if (analyzer.size >= 1024 && analyzer.size < 1048576) { analyzer.size = (analyzer.size / 1024).toFixed(2) + " KB" }
    if (analyzer.size >= 1048576 && analyzer.size < 1073741824) { analyzer.size = (analyzer.size / 1048576).toFixed(2) + " MB" }
    if (analyzer.size >= 1073741824) { analyzer.size = (analyzer.size / 1073741824).toFixed(2) + " GB" }

    setPlugin(analyzer)
  }, []);

  useEffect(() => {
    if (analyzer.status == "Enabled") { analyzer.currentStatus = "ON" }
    if (analyzer.status == "Disabled") { analyzer.currentStatus = "OFF" }

    if (analyzer.size < 1024 && analyzer.size > 0) { analyzer.size = (analyzer.size).toFixed(2) + " Bytes" }
    if (analyzer.size >= 1024 && analyzer.size < 1048576) { analyzer.size = (analyzer.size / 1024).toFixed(2) + " KB" }
    if (analyzer.size >= 1048576 && analyzer.size < 1073741824) { analyzer.size = (analyzer.size / 1048576).toFixed(2) + " MB" }
    if (analyzer.size >= 1073741824) { analyzer.size = (analyzer.size / 1073741824).toFixed(2) + " GB" }

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
                dispatch(NidsShowFile("analyzer"))
							  AppNavigate.navigateToModule(ev, 'nids-files', { })
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
        sortable: true
      },
      {
        field: '',
        name: 'Actions',
        width: '15%',
        render: data => actionButtonsRender(data)
      }
    ];
  }


  function actionButtonsRender(data) {
    return (
      <div className={'icon-box-action'}>

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

        <EuiToolTip content="View analyzer file" position="left">
          <EuiButtonIcon
            onClick={ev => {
              console.log(analyzer.path)
            }}
            iconType="eye"
            color={'primary'}
            aria-label="View analyzer file"
          />
        </EuiToolTip>


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
