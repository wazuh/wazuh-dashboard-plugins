/*
 * Wazuh app - React component for building the groups table.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiPanel,
  EuiPage,
  EuiOverlayMask,
  EuiConfirmModal,
} from '@elastic/eui';

// Wazuh components
import WzGroupsActionButtons from './actions-buttons-main';

import { connect } from 'react-redux';
import {
  withUserAuthorizationPrompt,
  withUserPermissions,
} from '../../../../../components/common/hocs';
import { compose } from 'redux';
import { TableWzAPI } from '../../../../../components/common/tables';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import {
  updateFileContent,
  updateGroupDetail,
  updateListItemsForRemove,
  updateShowModal,
} from '../../../../../redux/actions/groupsActions';
import { WzRequest, WzUserPermissions } from '../../../../../react-services';
import { getToasts } from '../../../../../kibana-services';
import GroupsHandler from './utils/groups-handler';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../../common/constants';
import NavigationService from '../../../../../react-services/navigation-service';

export class WzGroupsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      reload: Date.now(),
    };
    this.tableColumns = [
      {
        field: 'name',
        name: 'Name',
        align: 'left',
        searchable: true,
        sortable: true,
      },
      {
        field: 'count',
        name: 'Agents',
        align: 'left',
        searchable: true,
        sortable: true,
      },
      {
        field: 'configSum',
        name: 'Configuration checksum',
        align: 'left',
        searchable: true,
      },
      {
        name: 'Actions',
        align: 'left',
        searchable: false,
        render: item => {
          return (
            <div>
              <WzButtonPermissions
                buttonType='icon'
                permissions={[
                  { action: 'group:read', resource: `group:id:${item.name}` },
                ]}
                tooltip={{
                  position: 'top',
                  content: `View ${item.name} details`,
                }}
                aria-label='View group details'
                iconType='eye'
                onClick={async () => {
                  this.props.updateGroupDetail(item);
                }}
                color='primary'
              />
              <WzButtonPermissions
                buttonType='icon'
                permissions={[
                  {
                    action: 'group:update_config',
                    resource: `group:id:${item.name}`,
                  },
                  { action: 'cluster:status', resource: '*:*:*' },
                ]}
                tooltip={{
                  position: 'top',
                  content: 'Edit group configuration',
                }}
                aria-label='Edit group configuration'
                iconType='pencil'
                onClick={async ev => {
                  ev.stopPropagation();
                  this.showGroupConfiguration(item.name);
                }}
              />
              <WzButtonPermissions
                buttonType='icon'
                permissions={[
                  { action: 'group:delete', resource: `group:id:${item.name}` },
                ]}
                tooltip={{
                  posiiton: 'top',
                  content:
                    item.name === 'default'
                      ? `The ${item.name} group cannot be deleted`
                      : `Delete ${item.name}`,
                }}
                aria-label='Delete content'
                iconType='trash'
                onClick={async ev => {
                  ev.stopPropagation();
                  this.props.updateListItemsForRemove([item]);
                  this.props.updateShowModal(true);
                }}
                color='danger'
                isDisabled={item.name === 'default'}
              />
            </div>
          );
        },
      },
    ];
    this.reloadTable = this.reloadTable.bind(this);
  }

  reloadTable() {
    this.setState({ reload: Date.now() });
  }

  async removeItems(items) {
    try {
      const promises = items.map(
        async (item, i) => await GroupsHandler.deleteGroup(item.name),
      );
      await Promise.all(promises);
      getToasts().add({
        color: 'success',
        title: 'Success',
        text: 'Deleted successfully',
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error',
        text: error,
        toastLifeTimeMs: 3000,
      });
    } finally {
      this.reloadTable();
    }
  }

  async showGroupConfiguration(groupId) {
    const result = await GroupsHandler.getFileContent(
      `/groups/${groupId}/files/agent.conf?raw=true`,
    );

    const file = {
      name: 'agent.conf',
      content: result?.toString(),
      isEditable: true,
      groupName: groupId,
    };
    this.props.updateFileContent(file);
  }

  render() {
    const actionButtons = [
      <WzGroupsActionButtons reloadTable={this.reloadTable} />,
    ];

    const getRowProps = item => {
      const { id } = item;
      return {
        'data-test-subj': `row-${id}`,
        className: 'customRowClass',
        onClick: !WzUserPermissions.checkMissingUserPermissions(
          [{ action: 'group:read', resource: `group:id:${item.name}` }],
          this.props.userPermissions,
        )
          ? () => {
              NavigationService.getInstance().updateAndNavigateSearchParams({
                group: item.name,
              });
              return this.props.updateGroupDetail(item);
            }
          : undefined,
      };
    };

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <TableWzAPI
            reload={this.state.reload}
            actionButtons={actionButtons}
            title='Groups'
            description='From here you can list and check your groups, its agents and
            files.'
            tableColumns={this.tableColumns}
            tableInitialSortingField='name'
            searchTable={true}
            searchBarWQL={{
              suggestions: {
                field: () => [
                  { label: 'name', description: 'filter by name' },
                  { label: 'count', description: 'filter by count' },
                  {
                    label: 'configSum',
                    description: 'filter by configuration checksum',
                  },
                ],
                value: async (currentValue, { field }) => {
                  try {
                    const response = await WzRequest.apiReq('GET', '/groups', {
                      params: {
                        distinct: true,
                        limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                        select: field,
                        sort: `+${field}`,
                        ...(currentValue
                          ? { q: `${field}~${currentValue}` }
                          : {}),
                      },
                    });
                    return response?.data?.data.affected_items.map(item => ({
                      label: item[field],
                    }));
                  } catch (error) {
                    return [];
                  }
                },
              },
            }}
            rowProps={getRowProps}
            endpoint={'/groups'}
            downloadCsv={true}
            showReload={true}
            tablePageSizeOptions={[10, 25, 50, 100]}
          />
        </EuiPanel>
        {this.props.state.showModal ? (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`Delete ${
                this.props.state.itemList[0].file
                  ? this.props.state.itemList[0].file
                  : this.props.state.itemList[0].name
              } group?`}
              onCancel={() => this.props.updateShowModal(false)}
              onConfirm={() => {
                this.removeItems(this.props.state.itemList);
                this.props.updateShowModal(false);
              }}
              cancelButtonText='Cancel'
              confirmButtonText='Delete'
              defaultFocusedButton='cancel'
              buttonColor='danger'
            ></EuiConfirmModal>
          </EuiOverlayMask>
        ) : null}
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = dispatch => ({
  updateShowModal: showModal => dispatch(updateShowModal(showModal)),
  updateListItemsForRemove: itemList =>
    dispatch(updateListItemsForRemove(itemList)),
  updateGroupDetail: itemDetail => dispatch(updateGroupDetail(itemDetail)),
  updateFileContent: content => dispatch(updateFileContent(content)),
});

export default compose(
  withUserAuthorizationPrompt([
    { action: 'group:read', resource: 'group:id:*' },
  ]),
  connect(mapStateToProps, mapDispatchToProps),
  withUserPermissions,
)(WzGroupsOverview);
