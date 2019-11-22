import React from 'react';
import {
  EuiToolTip,
  EuiButtonIcon,
  EuiLink,
  EuiButtonEmpty,
  EuiOverlayMask,
  EuiConfirmModal,
} from '@elastic/eui';

export default class RulesetColumns {
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
            const defaultItems = this.tableProps.state.defaultItems;
            return (
              <div>
                <EuiToolTip position="top" content={`View ${item.name} details`}>
                  <EuiButtonIcon
                    aria-label="View group details"
                    iconType="eye"
                    onClick={async () => {
                      console.log('Ver content');
                      // const result = await this.rulesetHandler.getCdbList(
                      //   `${item.path}/${item.name}`
                      // );
                      // const file = { name: item.name, content: result, path: item.path };
                      // this.tableProps.updateListContent(file);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
                <EuiToolTip
                  position="top"
                  content={
                    defaultItems.indexOf(`${item.path}/${item.name}`) === -1
                      ? `Delete ${item.name}`
                      : `The ${item.name} list cannot be deleted`
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
                    disabled={defaultItems.indexOf(`${item.path}/${item.name}`) !== -1}
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
