// /*
//  * Wazuh app - React component for building the agents table.
//  *
//  * Copyright (C) 2015-2020 Wazuh, Inc.
//  *
//  * This program is free software; you can redistribute it and/or modify
//  * it under the terms of the GNU General Public License as published by
//  * the Free Software Foundation; either version 2 of the License, or
//  * (at your option) any later version.
//  *
//  * Find more information about this on the LICENSE file.
//  */

import React, { Component, Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  EuiBasicTable,
  EuiRange,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiTextArea,
  EuiToolTip,
  EuiTitle,
  EuiHealth,
  EuiSpacer,
  EuiCallOut,
  EuiFieldSearch,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiLoadingSpinner
} from '@elastic/eui';
import { toastNotifications } from 'ui/notify';
import { WzRequest } from '../../../react-services/wz-request';
import { NidsRequest } from '../../../react-services/nids-request';
import { ActionAgents } from '../../../react-services/action-agents';
import { AppNavigate } from '../../../react-services/app-navigate';
import { GroupTruncate } from '../../../components/common/util';
import { WzSearchBar, filtersToObject } from '../../../components/wz-search-bar';
import { getAgentFilterValues } from '../../../controllers/management/components/management/groups/get-agents-filters-values';
import { ManageNidsHosts } from '../../../../server/lib/manage-nids-hosts';
// import { EuiFlexItem, EuiFlexGroup, EuiSideNav, EuiIcon, EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import NidsAddNode from './nids-add-node'
import chrome from 'ui/chrome';
import axios from 'axios';
import { log } from '../../../../server/logger';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { toggleAddNodeMenu, SaveNodeToDetails, getAllNodes, deleteNode, nodeForEdit } from '../../../redux/actions/nidsActions';
import { getAllTags, getAllOrgs, getAllGroups } from '../../../redux/actions/nidsActions';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';

export const NidsTable = withReduxProvider(() => {
  const dispatch = useDispatch();
  const addNodeForm = useSelector(state => state.nidsReducers.addNodeForm);
  const nodes = useSelector(state => state.nidsReducers.nodes);

  const [newNodesList, setNewNodesList] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { 
    loadNodes() 
    dispatch(getAllTags())
    dispatch(getAllOrgs())
    dispatch(getAllGroups())
  }, []);

  useEffect(() => { 
    var nids = []
    const formatedNodes = (nodes || []).map(node => {
      nids.push(formatNode(node))
    });      
    //save nodes formated into array
    setNewNodesList(nids)    
    setIsLoading(false)
  }, [nodes]);

  //load header for table
  const title = headRender();

  function actionButtonsRender(node) {
    return (
      <div className={'icon-box-action'}>
        <EuiToolTip content="Manage node" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(SaveNodeToDetails(node))
              AppNavigate.navigateToModule(ev, 'node', { tab: { id: 'nodeDetails', text: 'Node details' } })
            }}
            iconType="eye"
            color={'primary'}
            aria-label="Label nodes"
          />
        </EuiToolTip>

        <EuiToolTip content="Edit node" position="left">
          <EuiButtonIcon
            onClick={ev => {               
              dispatch(toggleAddNodeMenu(true))
              dispatch(nodeForEdit(node.uuid))
            }}
            iconType="pencil"
            color={'primary'}
            aria-label="Edit node"
          />
        </EuiToolTip>

        <EuiToolTip content="Delete node" position="left">
          <EuiButtonIcon
            onClick={ev => {                             
              dispatch(deleteNode(node.uuid))
              
            }}
            iconType="trash"
            color={'danger'}
            aria-label="Label Delete node"
          />
        </EuiToolTip>        
      </div>
    );
  }

  async function loadNodes() {
    try{
      dispatch(getAllNodes())
    }catch(error){
      setIsLoading(false)
    }
  }

  function formatNode(node) {
    return {
      ...node,
      actions: node
    };
  }

  function searchNodes() {
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFieldSearch
              placeholder="Search node"
              fullWidth
              aria-label="Search node"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton>Search</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
    
        <EuiSpacer size="l" />    
      </Fragment>
    );
  }

  function headRender() {
    return (
      <div>     
        <EuiFlexGroup>

          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                  <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                    <h2>Nodes list </h2>
                  </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              // permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
              iconType="plusInCircle"
              onClick={() => {
                  dispatch(toggleAddNodeMenu(true));
                }
              }
            >
              Add new node
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
        name: 'Name',
        sortable: true,
        width: '20%',
        // truncateText: true
      },
      {
        field: 'ip',
        name: 'IP',
        width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'status',
        name: 'Status',
        width: '10%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'port',
        name: 'PORT',
        width: '10%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'tags',
        name: 'Tag(s)',
        width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'orgs',
        name: 'Org(s)',
        width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'actions',
        name: 'Actions',
        width: '15%',
        render: node => actionButtonsRender(node)
      }
    ];
  }
  
  return (
    <div>
      {searchNodes()}
      
      { addNodeForm==true ? <NidsAddNode /> : null }    

      <EuiSpacer size="m" />
      <EuiPanel paddingSize="m">
        {title}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiBasicTable
              items={newNodesList}
              itemId="uuid"
              columns={columns()}
              loading={isLoading}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
}
);