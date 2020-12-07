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
import { toggleAddSuricata, savePluginToEdit, deleteService, syncRuleset, IsLoadingData, changeServiceStatus, NidsShowFile, deleteWazuhFile } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';
import { AppNavigate } from '../../../../react-services/app-navigate';

export const WazuhTable = withReduxProvider(() => {
    const dispatch = useDispatch();
    const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
    const wazuhFiles = useSelector(state => state.nidsReducers.wazuhFiles);
    const loadingData = useSelector(state => state.nidsReducers.loadingData);

    const [plugins, setPlugins] = useState([])

    useEffect(() => { 
      dispatch(IsLoadingData(true));
      getPlugin()
    }, [wazuhFiles]);

    const title = headRender();

    function getPlugin() {
      var plug = [];
      [...Object.keys(wazuhFiles).map((item) => { 
        if(wazuhFiles[item]["size"] == "-1"){
          wazuhFiles[item]["size"] = "no file"
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
        if(wazuhFiles[item]["path"] != file.service.path){
          newFileList.push(wazuhFiles[item]["path"])
        }                
      })];
      return newFileList;
    }

    function headRender() {
        return (
          <div>     
            <EuiFlexGroup>

              <EuiFlexItem>              
                <EuiFlexGroup>
                  <EuiFlexItem>
                      <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                        <h2>Output </h2>
                      </EuiTitle>
                  </EuiFlexItem>                  
                </EuiFlexGroup>
              </EuiFlexItem>
                  
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="plusInCircle"
                  onClick={() => {
                    // dispatch(toggleAddSuricata(true))
                  }}
                >
                  Add Suricata
                </EuiButtonEmpty>
              </EuiFlexItem>
           
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="refresh"
                  onClick={() => {
                    // dispatch(toggleAddSuricata(true))
                  }}
                >
                  Reload Wazuh information
                </EuiButtonEmpty>
              </EuiFlexItem>
           
           
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="documentEdit"
                  onClick={() => {
                    // dispatch(toggleAddSuricata(true))
                  }}
                >
                  Edit main Wazuh config file
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

        <EuiToolTip content="Delete file" position="left">
          <EuiButtonIcon
            onClick={ev => {                         
              var listData = deleteFile({uuid: nodeDetail.uuid, service:data})
              dispatch(deleteWazuhFile({uuid: nodeDetail.uuid, paths:listData}))
            }}
            iconType="trash"
            color={'danger'}
            aria-label="Label Delete file"
          />
        </EuiToolTip>        
      </div>
     );
    }

    return (
      <div>
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