import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import GroupsHandler from '../utils/groups-handler';
import beautifier from '../../../../../../utils/json-beautifier';

export default class GroupsFilesColumns {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.adminMode = this.tableProps.state.adminMode;

    const { itemDetail } = this.tableProps.state;
    this.groupsHandler = GroupsHandler;

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'filename',
          name: 'File',
          align: 'left',
          sortable: true,
        },
        {
          field: 'hash',
          name: 'Checksum',
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
                <EuiToolTip position="top" content={`See file content`}>
                  <EuiButtonIcon
                    aria-label="See file content"
                    iconType="eye"
                    onClick={async () => {
                      const result = await this.groupsHandler.getFileContent(
                        `/agents/groups/${itemDetail.name}/files/${item.filename}`
                      );

                      const isEditable = item.filename === 'agent.conf';
                      const data = !isEditable ? beautifier.prettyPrint(result) : result;

                      const file = { name: item.filename, content: data, isEditable: isEditable, groupName: itemDetail.name };
                      this.tableProps.updateFileContent(file);
                    }}
                    color="primary"
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
