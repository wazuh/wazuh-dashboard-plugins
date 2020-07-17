import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';

export default class GroupsAgentsColumns {
  constructor(tableProps) {
    this.tableProps = tableProps;

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'id',
          name: 'Id',
          align: 'left',
          sortable: true
        },
        {
          field: 'name',
          name: 'Name',
          align: 'left',
          sortable: true
        },
        {
          field: 'ip',
          name: 'Ip',
          align: 'left',
          sortable: true
        },
        {
          field: 'status',
          name: 'Status',
          align: 'left',
          sortable: true
        },
        {
          field: 'os.name',
          name: 'Os name',
          align: 'left',
          sortable: true
        },
        {
          field: 'os.version',
          name: 'Os version',
          align: 'left',
          sortable: true
        },
        {
          field: 'version',
          name: 'Version',
          align: 'left',
          sortable: true
        }
      ];
      this.columns.push({
        name: 'Actions',
        align: 'left',
        render: item => {
          return (
            <div>
              {(this.tableProps.adminMode && (
                <div>
                  <EuiToolTip position="top" content={`Go to the agent`}>
                    <EuiButtonIcon
                      aria-label="Go to the agent"
                      iconType="eye"
                      onClick={async () => {
                        this.tableProps.groupsProps.showAgent(item);
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                  <EuiToolTip position="top"
                    content={`Remove agent from this group`}>
                    <EuiButtonIcon
                      aria-label="Remove agent from this group"
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
              )) || (
                  <div>
                    <EuiToolTip position="top" content={`Go to the agent`}>
                      <EuiButtonIcon
                        aria-label="Go to the agent"
                        iconType="eye"
                        onClick={async () => {
                          this.tableProps.groupsProps.showAgent(item);
                        }}
                        color="primary"
                      />
                    </EuiToolTip>
                  </div>
                )}
            </div>
          );
        }
      });
    };

    this.buildColumns();
  }
}
