import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiBadge } from '@elastic/eui';
import { resourceDictionary, ResourcesHandler, ResourcesConstants } from '../../common/resources-handler';
import exportCsv from '../../../../../../react-services/wz-csv';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';
import { WzButtonPermissionsModalConfirm } from '../../../../../../components/common/buttons';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { UIErrorLog } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOptions } from '../../common/error-helper';
import { Columns } from '../../common/interfaces';

export default class CDBListsColumns {

  columns: Columns = { lists: [] };

  constructor(props) {
    this.props = props;
    this._buildColumns();
  }

  _buildColumns() {
    this.columns = {
      lists: [
        {
          field: 'filename',
          name: 'Name',
          align: 'left',
          sortable: true
        },
        {
          field: 'relative_dirname',
          name: 'Path',
          align: 'left',
          sortable: true
        },
        {
          name: 'Actions',
          align: 'left',
          render: (item) => (
            <EuiToolTip position="top" content={`Export ${item.filename}`}>
              <EuiButtonIcon
                aria-label="Export list"
                iconType="exportAction"
                onClick={async ev => {
                  try {
                    ev.stopPropagation();
                    await exportCsv(`/lists?path=${item.relative_dirname}/${item.filename}`,
                      [{ _isCDBList: true, name: 'path', value: `${item.relative_dirname}/${item.filename}` }],
                      item.filename
                    )
                  } catch (error) {
                    const options: UIErrorLog = getErrorOptions(
                      error,
                      'Lists.exportFile'
                    );
                    getErrorOrchestrator().handleError(options);
                  }
                }}
                color="primary"
              />
            </EuiToolTip>
          )
        }
      ]
    };

    const getReadButtonPermissions = (item) => {
      const { permissionResource } = resourceDictionary[ResourcesConstants.LISTS];
      return [
        {
          action: `${ResourcesConstants.LISTS}:read`,
          resource: permissionResource(item.filename),
        },
      ];
    };

    const getEditButtonPermissions = (item) => {
      const { permissionResource } = resourceDictionary[ResourcesConstants.LISTS];
      return [
        {
          action: `${ResourcesConstants.LISTS}:read`,
          resource: permissionResource(item.filename),
        },
        { action: `${ResourcesConstants.LISTS}:update`, resource: permissionResource(item.filename) },
      ];
    };

    const getDeleteButtonPermissions = (item) => {
      const { permissionResource } = resourceDictionary[ResourcesConstants.LISTS];
      return [
        {
          action: `${ResourcesConstants.LISTS}:delete`,
          resource: permissionResource(item.filename),
        },
      ];
    };

    // @ts-ignore
    this.columns.lists[2] =
    {
      name: 'Actions',
      align: 'left',
      render: item => {
        const defaultItems = this.props.state.defaultItems;
        return (
          <div>
            <WzButtonPermissions
              buttonType='icon'
              permissions={getEditButtonPermissions(item)}
              aria-label="Edit content"
              iconType="pencil"
              tooltip={{ position: 'top', content: `Edit ${item.filename} content` }}
              onClick={async (ev) => {
                try {
                  ev.stopPropagation();
                  const resourcesHandler = new ResourcesHandler(ResourcesConstants.LISTS);
                  const result = await resourcesHandler.getFileContent(item.filename);
                  const file = { name: item.filename, content: result, path: item.relative_dirname };
                  this.props.updateListContent(file);
                } catch (error) {
                  const options: UIErrorLog = getErrorOptions(
                    error,
                    'Lists.editFileContent'
                  );
                  getErrorOrchestrator().handleError(options);
                }
              }}
              color="primary"
            />
            <WzButtonPermissionsModalConfirm
              buttonType="icon"
              permissions={getDeleteButtonPermissions(item)}
              tooltip={{ position: 'top', content: (defaultItems.indexOf(`${item.relative_dirname}`) === -1) ? `Delete ${item.filename}` : `The ${item.filename} list cannot be deleted` }}
              aria-label="Delete file"
              iconType="trash"
              isDisabled={defaultItems.indexOf(`${item.relative_dirname}`) !== -1}
              onConfirm={async () => {
                try {
                  this.props.removeItems([item])
                } catch (error) {
                  const options: UIErrorLog = getErrorOptions(
                    error,
                    'Lists.deleteFile'
                  );
                  getErrorOrchestrator().handleError(options);
                }
              }}
              onClose={async (ev) => ev.stopPropagation()}
              onClick={(ev) => ev.stopPropagation()}
              color="danger"
              modalTitle={'Are you sure?'}
              modalProps={{
                buttonColor: 'danger',
                onClick: (ev) => ev.stopPropagation()
              }}
            />
            <WzButtonPermissions
              buttonType='icon'
              permissions={getReadButtonPermissions(item)}
              aria-label="Export list"
              iconType="exportAction"
              tooltip={{ position: 'top', content: `Export ${item.filename} content` }}
              onClick={async (ev) => {
                try {
                  ev.stopPropagation();
                  await exportCsv(`/lists`,
                    [{ _isCDBList: true, name: 'filename', value: `${item.filename}` }],
                    item.filename
                  )
                } catch (error) {
                  const options: UIErrorLog = getErrorOptions(
                    error,
                    'Lists.exportFile'
                  );
                  getErrorOrchestrator().handleError(options);
                }
              }}
              color="primary"
            />
          </div>
        )
      }
    }
  };
}
