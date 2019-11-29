import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import GroupsHandler from './groups-handler';

export default class GroupsColums {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.adminMode = this.tableProps.state.adminMode;
    this.groupsHandler = GroupsHandler;

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'name',
          name: 'Name',
          align: 'left',
          sortable: true,
        },
        {
          field: 'count',
          name: 'Agents',
          align: 'left',
          sortable: true,
        },
        {
          field: 'configSum',
          name: 'Configuration checksum',
          align: 'left',
          sortable: true,
        },
      ];
      // If the admin mode is enabled the action column in CDB lists is shown
      if (this.adminMode) {
        this.columns.push({
          name: 'Actions',
          align: 'left',
          render: item => {
            return (
              <div>
                <EuiToolTip position="top" content={`View ${item.name} details`}>
                  <EuiButtonIcon
                    aria-label="View group details"
                    iconType="eye"
                    onClick={async () => {
                      this.tableProps.updateGroupDetail(item);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
                <EuiToolTip position="top" content={'Edit group configuration'}>
                  <EuiButtonIcon
                    aria-label="Edit group configuration"
                    iconType="pencil"
                    onClick={async () => {
                      this.showGroupConfiguration(item.name);
                    }}
                  />
                </EuiToolTip>
                <EuiToolTip
                  position="top"
                  content={
                    item.name === 'default'
                      ? `The ${item.name} group cannot be deleted`
                      : `Delete ${item.name}`
                  }
                >
                  <EuiButtonIcon
                    aria-label="Delete content"
                    iconType="trash"
                    onClick={async () => {
                      this.tableProps.updateListItemsForRemove([item]);
                      this.tableProps.updateShowModal(true);
                    }}
                    color="danger"
                    disabled={item.name === 'default'}
                  />
                </EuiToolTip>
              </div>
            );
          },
        });
      }
    };

    this.buildColumns();
  }

  async showGroupConfiguration(groupId) {
    const result = await this.groupsHandler.getFileContent(
      `/agents/groups/${groupId}/files/agent.conf`
    );

    const file = { name: 'agent.conf', content: result, isEditable: true, groupName: groupId};
    this.tableProps.updateFileContent(file);
  }
}
