import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import GroupsHandler from '../utils/groups-handler';
import beautifier from '../../../../../../utils/json-beautifier';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';

export default class GroupsFilesColumns {
  constructor(tableProps) {
    this.tableProps = tableProps;

    const { itemDetail } = this.tableProps.state;
    this.groupsHandler = GroupsHandler;

    this.actionFile = async (item, edit) => {
      let result = await this.groupsHandler.getFileContent(
        `/groups/${itemDetail.name}/files/${item.filename}?raw=true`,
      );

      if (Object.keys(result).length == 0) {
        result = '';
      }

      const data = edit
        ? result?.toString()
        : typeof result === 'object'
        ? JSON.stringify(result, null, 2)
        : result.toString();

      const file = {
        name: item.filename,
        content: data,
        isEditable: edit,
        groupName: itemDetail.name,
      };

      this.tableProps.updateFileContent(file);
    };

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'filename',
          name: 'File',
          align: 'left',
          searchable: true,
          sortable: true,
        },
        {
          field: 'hash',
          name: 'Checksum',
          align: 'left',
          searchable: true,
          sortable: true,
        },
      ];
      this.columns.push({
        name: 'Actions',
        align: 'left',
        render: item => {
          return (
            <div>
              <EuiToolTip position='top' content={`See file content`}>
                <EuiButtonIcon
                  aria-label='See file content'
                  iconType='eye'
                  onClick={() => this.actionFile(item, false)}
                  color='primary'
                />
              </EuiToolTip>
              {item.filename === 'agent.conf' && (
                <WzButtonPermissions
                  buttonType='icon'
                  aria-label='Edit content'
                  iconType='pencil'
                  permissions={[
                    {
                      action: 'group:update_config',
                      resource: `group:id:${itemDetail.name}`,
                    },
                    { action: 'cluster:status', resource: '*:*:*' },
                  ]}
                  tooltip={{
                    position: 'top',
                    content: `Edit ${item.filename}`,
                  }}
                  onClick={() => this.actionFile(item, true)}
                  color='primary'
                />
              )}
            </div>
          );
        },
      });
    };

    this.buildColumns();
  }
}
