import React from 'react';
import { resourceDictionary, ResourcesHandler, ResourcesConstants } from '../../common/resources-handler';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';
import { WzButtonPermissionsModalConfirm } from '../../../../../../components/common/buttons';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { UIErrorLog } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOptions } from '../../common/error-helper';
import { Columns } from '../../common/interfaces';


export default class DecodersColumns {

  columns: Columns = {};

  constructor(props) {
    this.props = props;
    this._buildColumns();
  }

  _buildColumns() {
    this.columns = {
      decoders: [
        {
          field: 'name',
          name: 'Name',
          align: 'left',
          sortable: true
        },
        {
          field: 'details.program_name',
          name: 'Program name',
          align: 'left',
          sortable: false
        },
        {
          field: 'details.order',
          name: 'Order',
          align: 'left',
          sortable: false
        },
        {
          field: 'filename',
          name: 'File',
          align: 'left',
          sortable: true,
          render: (value, item) => {
            return (
              <WzButtonPermissions
                buttonType='link'
                permissions={getReadButtonPermissions(item)}
                tooltip={{ position: 'top', content: `Show ${value} content` }}
                onClick={async (ev) => {
                  try {
                    ev.stopPropagation();
                    const resourcesHandler = new ResourcesHandler(ResourcesConstants.DECODERS);
                    const result = await resourcesHandler.getFileContent(value);
                    const file = { name: value, content: result, path: item.relative_dirname };
                    this.props.updateFileContent(file);
                  } catch (error) {
                    const options: UIErrorLog = getErrorOptions(
                      error,
                      'Decoders.readFileContent'
                    );
                    getErrorOrchestrator().handleError(options);
                  }
                }}>
                {value}
              </WzButtonPermissions>
            );
          }
        },
        {
          field: 'relative_dirname',
          name: 'Path',
          align: 'left',
          sortable: true
        }
      ],
      files: [
        {
          field: 'filename',
          name: 'File',
          align: 'left',
          sortable: true
        },
        {
          name: 'Actions',
          align: 'left',
          render: item => {
            if (item.relative_dirname.startsWith('ruleset/')) {
              return (
                <WzButtonPermissions
                  buttonType='icon'
                  permissions={getReadButtonPermissions(item)}
                  aria-label="Show content"
                  iconType="eye"
                  tooltip={{ position: 'top', content: `View the content of ${item.filename}` }}
                  onClick={async ev => {
                    try {
                      ev.stopPropagation();
                      const resourcesHandler = new ResourcesHandler(ResourcesConstants.DECODERS);
                      const result = await resourcesHandler.getFileContent(item.filename);
                      const file = { name: item.filename, content: result, path: item.relative_dirname };
                      this.props.updateFileContent(file);
                    } catch (error) {
                      const options: UIErrorLog = getErrorOptions(
                        error,
                        'Decoders.readFileContent'
                      );
                      getErrorOrchestrator().handleError(options);
                    }
                  }}
                  color="primary"
                />
              );
            } else {
              return (
                <div>
                  <WzButtonPermissions
                    buttonType='icon'
                    permissions={getEditButtonPermissions(item)}
                    aria-label="Edit content"
                    iconType="pencil"
                    tooltip={{ position: 'top', content: `Edit ${item.filename} content` }}
                    onClick={async ev => {
                      try {
                        ev.stopPropagation();
                        const resourcesHandler = new ResourcesHandler(ResourcesConstants.DECODERS);
                        const result = await resourcesHandler.getFileContent(item.filename);
                        const file = { name: item.filename, content: result, path: item.relative_dirname };
                        this.props.updateFileContent(file);
                      } catch (error) {
                        const options: UIErrorLog = getErrorOptions(
                          error,
                          'Files.editFileContent'
                        );
                        getErrorOrchestrator().handleError(options);
                      }
                    }}
                    color="primary"
                  />
                  <WzButtonPermissionsModalConfirm
                    buttonType="icon"
                    permissions={getDeleteButtonPermissions(item)}
                    tooltip={{ position: 'top', content: `Remove ${item.filename} file` }}
                    aria-label="Delete file"
                    iconType="trash"
                    onConfirm={async () => {
                      try {
                        this.props.removeItems([item]);
                      } catch (error) {
                        const options: UIErrorLog = getErrorOptions(
                          error,
                          'Files.deleteFile'
                        );
                        getErrorOrchestrator().handleError(options);
                      }
                    }}
                    color="danger"
                    modalTitle={'Are you sure?'}
                    modalProps={{
                      buttonColor: 'danger',
                    }}
                  />
                </div>
              );
            }
          }
        }
      ]
    };

    const getReadButtonPermissions = (item) => {
      const { permissionResource } = resourceDictionary[ResourcesConstants.DECODERS];
      return [
        {
          action: `${ResourcesConstants.DECODERS}:read`,
          resource: permissionResource(item.filename),
        },
      ];
    };

    const getEditButtonPermissions = (item) => {
      const { permissionResource } = resourceDictionary[ResourcesConstants.DECODERS];
      return [
        {
          action: `${ResourcesConstants.DECODERS}:read`,
          resource: permissionResource(item.filename),
        },
        { action: `${ResourcesConstants.DECODERS}:update`, resource: permissionResource(item.filename) },
      ];
    };

    const getDeleteButtonPermissions = (item) => {
      const { permissionResource } = resourceDictionary[ResourcesConstants.DECODERS];
      return [
        {
          action: `${ResourcesConstants.DECODERS}:delete`,
          resource: permissionResource(item.filename),
        },
      ];
    };

  }
}
