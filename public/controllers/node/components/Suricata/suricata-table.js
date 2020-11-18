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
import { toggleAddSuricata, savePluginToEdit, deleteService, syncRuleset, changeServiceStatus } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';


export const SuricataTable = withReduxProvider(() => {
    const dispatch = useDispatch();
    const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
    const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);
  
    const [isLoading, setIsLoading] = useState(false)
    const [plugins, setPlugins] = useState([])

    useEffect(() => { 
      getPlugin()
    }, [nodePlugins]);

    const title = headRender();

    function getPlugin() {
      var allSuricata = [];
      [...Object.keys(nodePlugins).map((item) => { 
        if(nodePlugins[item]["type"] == "suricata"){
          nodePlugins[item]["service"] = item
          allSuricata.push(nodePlugins[item])
        }
      })];
      
      var plug = []
      const formatedNodes = (allSuricata || []).map(plugin => {
        plug.push(formatNode(plugin))
      });  
      
      setPlugins(plug)
    }
    
    function formatNode(plugin) {
      return {
        ...plugin,
        actions: plugin
      };
    }

    function headRender() {
        return (
          <div>     
            <EuiFlexGroup>

              <EuiFlexItem>              
                <EuiFlexGroup>
                  <EuiFlexItem>
                      <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                        <h2>Suricata list </h2>
                      </EuiTitle>
                  </EuiFlexItem>                  
                </EuiFlexGroup>
              </EuiFlexItem>

                  
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    // permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
                    iconType="plusInCircle"
                    onClick={() => {dispatch(toggleAddSuricata(true))}}
                  >
                    Add Suricata
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
        field: 'status',
        name: 'Status',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'running',
        name: 'Running',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'bpf',
        name: 'BPF',
        // width: '10%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'localRulesetName',
        name: 'Ruleset',
        // width: '10%',
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
          data.status == "enabled"
          ?
          <EuiToolTip content="Stop Suricata" position="left">
            <EuiButtonIcon
              onClick={ev => {                
                dispatch(changeServiceStatus(data))
              }}
              iconType="stop"
              color={'primary'}
              aria-label="Stop Suricata"
            />
          </EuiToolTip>
          :
          <EuiToolTip content="Launch Suricata" position="left">
            <EuiButtonIcon
              onClick={ev => {
                dispatch(changeServiceStatus(data))
              }}
              iconType="play"
              color={'primary'}
              aria-label="Launch Suricata"
            />
          </EuiToolTip>

        }

        <EuiToolTip content="Sync ruleset" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(syncRuleset({uuid: nodeDetail.uuid, service: data.service, ruleset: data.ruleset, type: "node"}))
            //   AppNavigate.navigateToModule(ev, 'node', { tab: { id: 'nodeDetails', text: 'Node details' } })
            }}
            iconType="refresh"
            color={'primary'}
            aria-label="Sync ruleset"
          />
        </EuiToolTip>

        <EuiToolTip content="Edit Suricata" position="left">
          <EuiButtonIcon
            onClick={ev => {               
              dispatch(toggleAddSuricata(true))
              dispatch(savePluginToEdit(data))
            }}
            iconType="pencil"
            color={'primary'}
            aria-label="Edit Suricata"
          />
        </EuiToolTip>

        <EuiToolTip content="Delete Suricata" position="left">
          <EuiButtonIcon
            onClick={ev => {            
              console.log(data.service)                 
              console.log(nodeDetail.uuid)                 
              dispatch(deleteService({uuid: nodeDetail.uuid, service:data.service}))              
            }}
            iconType="trash"
            color={'danger'}
            aria-label="Label Delete Suricata"
          />
        </EuiToolTip>        
      </div>
     );
    }

    return (
        <div>
            <EuiSpacer size="m" />
            <EuiPanel paddingSize="m">
            {title}
            <EuiFlexGroup>
                <EuiFlexItem>
                <EuiBasicTable
                     items={plugins}
                     itemId="uuid"
                     columns={columns()}
                     loading={isLoading}
                />
                </EuiFlexItem>
            </EuiFlexGroup>
            </EuiPanel>
       </div>
    )
});