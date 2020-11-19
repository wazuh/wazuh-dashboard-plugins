import React, { Component, Fragment, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import {
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiToolTip,
  EuiTitle,
  EuiHealth,
  EuiSpacer,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiDescribedFormGroup,
  EuiFieldPassword,
  EuiLoadingSpinner,
  EuiFlexGrid,
  EuiFieldText,
  DisplayToggles,
  EuiFormRow,
  EuiComboBox,
  EuiForm
} from '@elastic/eui';
// import { toastNotifications } from 'ui/notify';
// import { WzRequest } from '../../../react-services/wz-request';
// import { NidsRequest } from '../../../react-services/nids-request';
// import { ActionAgents } from '../../../react-services/action-agents';
// import { AppNavigate } from '../../../react-services/app-navigate';
// import { GroupTruncate } from '../../../components/common/util';
// import { WzSearchBar, filtersToObject } from '../../../components/wz-search-bar';
// import { getAgentFilterValues } from '../../../controllers/management/components/management/groups/get-agents-filters-values';
import { AddNodeTags } from './add-node-tags';
import { AddNodeOrgs } from './add-node-orgs';
import { AddNodeGroups } from './add-node-groups';
// import { ManageNidsHosts } from '../../../../server/lib/manage-nids-hosts';
// // import { EuiFlexItem, EuiFlexGroup, EuiSideNav, EuiIcon, EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
// import chrome from 'ui/chrome';
// import axios from 'axios';
// import { log } from '../../../../server/logger';
// import { connect } from 'react-redux';
import { toggleAddNodeMenu, addNode, editNode, nodeForEdit } from '../../../redux/actions/nidsActions';
// import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { useSelector, useDispatch } from 'react-redux';
// import { compose } from 'redux';

const NidsAddNode = () => {
  const dispatch = useDispatch();  
  const nodes = useSelector(state => state.nidsReducers.nodes);
  const nodeToEdit = useSelector(state => state.nidsReducers.nodeToEdit);
  const addNodeForm = useSelector(state => state.nidsReducers.addNodeForm);
  const savedTags = useSelector(state => state.nidsReducers.savedTags);
  const savedOrgs = useSelector(state => state.nidsReducers.savedOrgs);
  const savedGroups = useSelector(state => state.nidsReducers.savedGroups);

  const [newNodeData, setNewNodeData] = useState({
    uuid: "",
    name: "",
    ip: "",
    port: "",
    nodeuser: "",
    nodepass: "",
    agent: ""
  })

  useEffect(() => { 
    //check for edit node
    if(nodeToEdit != ""){
      nodes.map(x => {
        if(nodeToEdit == x.uuid){
          setNewNodeData({
            uuid: x.uuid,
            name: x.name,
            ip: x.ip,
            port: x.port,
            nodeuser: x.nodeuser,
            nodepass: x.nodepass,
            agent: x.agent
          })  
        }      
      })
    }
  }, []);


  const handleRequest = () => {
    const enrollData = {
      Node:newNodeData,
      Tags:savedTags,
      Group:savedGroups,
      Orgs:savedOrgs,
      Suricata:{}
    }

    console.log(enrollData);
    {
      nodeToEdit != "" ? 
      dispatch(editNode(enrollData)):
      dispatch(addNode(enrollData))    
    }
  }
  
  const handleChangeEdit = (e) => {
    setNewNodeData({            
        ...newNodeData,
        [event.target.name]: event.target.value
    })
  }
  
  return (
    <div>
      <EuiPanel paddingSize="m">
        {/* Header */}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                  <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                    {
                      nodeToEdit != "" ? 
                      <h2>Edit node </h2> :
                      <h2>Add node </h2> 
                    }
                  </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="cross"
              onClick={() => {
                  dispatch(toggleAddNodeMenu(false));
                  dispatch(nodeForEdit(""))
                }
              }
            >
              Close
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />
        {/* First row */}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Node name">
              {
                nodeToEdit != "" ? 
                <EuiFieldText value={newNodeData.name || ''} name="name" aria-label="Node name" onChange={handleChangeEdit ||''}/>:
                <EuiFieldText name="name" aria-label="Node name" onChange={handleChangeEdit ||''}/>
              }
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        {/* Second row */}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Node IP">
              {
                nodeToEdit != "" ? 
                <EuiFieldText value={newNodeData.ip || ''} name="ip" aria-label="Node IP" onChange={handleChangeEdit ||''}/>:
                <EuiFieldText name="ip" aria-label="Node IP" onChange={handleChangeEdit ||''}/>
              }
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Node port">
              {
                nodeToEdit != "" ? 
                <EuiFieldText value={newNodeData.port || ''} name="port" aria-label="Node port" onChange={handleChangeEdit ||''}/>:
                <EuiFieldText name="port" aria-label="Node port" onChange={handleChangeEdit ||''}/>
              }
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        {/* Third row */}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Node user">
              {
                nodeToEdit != "" ? 
                <EuiFieldText value={newNodeData.nodeuser || ''} name="nodeuser" aria-label="Node user" onChange={handleChangeEdit ||''}/>:
                <EuiFieldText name="nodeuser" aria-label="Node user" onChange={handleChangeEdit ||''}/>
              }
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Node password">
              {
                nodeToEdit != "" ? 
                <EuiFieldPassword value={newNodeData.nodepass || ''} name="nodepass" aria-label="Node password" onChange={handleChangeEdit ||''}/>:
                <EuiFieldPassword name="nodepass" aria-label="Node password" onChange={handleChangeEdit ||''}/>
              }
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* Fiveth row */}
        <EuiFlexGroup>
          <AddNodeTags></AddNodeTags>
          <AddNodeOrgs></AddNodeOrgs>
        </EuiFlexGroup>

        {/* Fiveth row */}
        <EuiFlexGroup>
          <AddNodeGroups></AddNodeGroups>
        </EuiFlexGroup>





        {/* <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow>
              <h4>Agents</h4>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
          <EuiFormRow label="Agent ID"> */}
            {/* {
              nodeToEdit != "" ? 
              <EuiFieldPassword value={newNodeData.nodepass} name="nodepass" aria-label="Node password" onChange={handleChangeEdit}/>:
              <EuiFieldPassword name="nodepass" aria-label="Node password" onChange={handleChangeEdit}/>
            } */}
              {/* <EuiFieldText value={newNodeData.agent || ''} name="agent" aria-label="Agent ID" onChange={handleChangeEdit || ''}/>

            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup> */}
        {/* Fourth row */}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow>
              {
                nodeToEdit != "" ? 
                <EuiButton onClick={() => {handleRequest()}}>Edit</EuiButton>:
                <EuiButton onClick={() => {handleRequest()}}>Add</EuiButton>                
              }
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  )
}

export default NidsAddNode