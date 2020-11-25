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
import { IsLoadingData, toggleSocketNetwork, savePluginToEdit, stopStapService, deployStapService, deleteService } from '../../../../redux/actions/nidsActions';

export const SocketToNewtwork = () => {
  const dispatch = useDispatch();
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
  const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);
  const loadingData = useSelector(state => state.nidsReducers.loadingData);

  const [plugins, setPlugins] = useState([])

  useEffect(() => {    
    console.log(nodePlugins);
    dispatch(IsLoadingData(true));
    formatPlugin()
  }, []);
  
  useEffect(() => {        
    dispatch(IsLoadingData(true));
    formatPlugin()
  }, [nodePlugins]);

  function formatPlugin(){
    var allSTAP = [];

      [...Object.keys(nodePlugins).map((item) => { 
        if(nodePlugins[item]["type"] == "socket-network"){
          nodePlugins[item]["service"] = item
          {nodePlugins[item]["pid"] != "none" ? nodePlugins[item]["pid"] = "on" : nodePlugins[item]["pid"] = "off"}
          {"running" in nodePlugins[item] ? nodePlugins[item]["running"] = "running" : nodePlugins[item]["running"] = "stopped"}
          allSTAP.push(nodePlugins[item])
        }
      })];
      
      var plug = []
      const formatedNodes = (allSTAP || []).map(plugin => {
        plug.push( {...plugin, actions: plugin} )
      });  
      
      setPlugins(plug)      
      dispatch(IsLoadingData(false));
  }


  const title = headRender();

  function headRender() {
    return (
      <div>
        <EuiFlexGroup>

          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                  <h2>Socket->Network </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="plusInCircle"
              onClick={() => { dispatch(toggleSocketNetwork("add"))}}
            >
              Add Socket->Network
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
        field: 'name',
        name: 'Description',
        sortable: true,
        // width: '20%',
        // truncateText: true
      },
      {
        field: 'pid',
        name: 'Status',
        sortable: true,
        // width: '20%',
        // truncateText: true
      },
      {
        field: 'running',
        name: 'Running',
        sortable: true,
        // width: '20%',
        // truncateText: true
      },
      {
        field: 'port',
        name: 'Port',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'cert',
        name: 'Certificate',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'interface',
        name: 'Interface',
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
        {
          data["running"] == "running" 
          ?
          <EuiToolTip content="Stop" position="left">
            <EuiButtonIcon
              onClick={ev => { 
                dispatch(IsLoadingData(true));
                dispatch(stopStapService(
                  {
                    uuid: nodeDetail.uuid,
                    service: data.service,
                    type: data.type,
                  }
                )) 
              }}
              iconType="stop"
              color={'primary'}
              aria-label="Stop"
            />
          </EuiToolTip>
          :
          <EuiToolTip content="Play" position="left">
            <EuiButtonIcon
              onClick={ev => { 
                dispatch(IsLoadingData(true));
                dispatch(deployStapService(
                  {
                    uuid: nodeDetail.uuid,
                    service: data.service,
                    type: data.type,
                  }
                )) 
              }}
              iconType="play"
              color={'primary'}
              aria-label="Play"
            />
          </EuiToolTip>
        }

        <EuiToolTip content="Edit" position="left">
          <EuiButtonIcon
            onClick={ev => { 
              dispatch(savePluginToEdit(data))
              dispatch(toggleSocketNetwork("edit")) 
            }}
            iconType="documentEdit"
            color={'primary'}
            aria-label="Edit"
          />
        </EuiToolTip>

        <EuiToolTip content="Delete" position="left">
          <EuiButtonIcon
            onClick={ev => { dispatch(IsLoadingData(true)); dispatch(deleteService({uuid: nodeDetail.uuid, service:data.service})) }}
            iconType="trash"
            color={'primary'}
            aria-label="Delete"
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
}
