import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';

export default class GroupsColums {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.adminMode = this.tableProps.state.adminMode;

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
          name: 'Configuratino checksum',
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
}
