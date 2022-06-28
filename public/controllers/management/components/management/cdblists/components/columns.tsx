import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiBadge } from '@elastic/eui';
import { resourceDictionary, ResourcesHandler, ResourcesConstants } from '../../common/resources-handler';
import exportCsv from '../../../../../../react-services/wz-csv';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';

export default class CDBListsColumns {
  constructor(props) {
    this.props = props;

    this.buildColumns = () => {
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
                    ev.stopPropagation();
                    await exportCsv(`/lists?path=${item.relative_dirname}/${item.filename}`,
                      [{ _isCDBList: true, name: 'path', value: `${item.relative_dirname}/${item.filename}` }],
                      item.filename
                    )
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
                  ev.stopPropagation();
                  const resourcesHandler = new ResourcesHandler(ResourcesConstants.LISTS);
                  const result = await resourcesHandler.getFileContent(item.filename);
                  const file = { name: item.filename, content: result, path: item.relative_dirname };
                  this.props.updateListContent(file);
                }}
                color="primary"
              />
              <WzButtonPermissions
                buttonType='icon'
                permissions={getDeleteButtonPermissions(item)}
                aria-label="Delete file"
                iconType="trash"
                tooltip={{ position: 'top', content: (defaultItems.indexOf(`${item.relative_dirname}`) === -1) ? `Delete ${item.filename}` : `The ${item.filename} list cannot be deleted` }}
                onClick={async (ev) => {
                  ev.stopPropagation();
                  this.props.updateListItemsForRemove([item]);
                  this.props.updateShowModal(true);
                }}
                color="danger"
                isDisabled={defaultItems.indexOf(`${item.relative_dirname}`) !== -1}
              />
              <WzButtonPermissions
                buttonType='icon'
                permissions={getReadButtonPermissions(item)}
                aria-label="Export list"
                iconType="exportAction"
                tooltip={{ position: 'top', content: `Export ${item.filename} content` }}
                onClick={async (ev) => {
                  ev.stopPropagation();
                  await exportCsv(`/lists`,
                    [{ _isCDBList: true, name: 'filename', value: `${item.filename}` }],
                    item.filename
                  )
                }}
                color="primary"
              />
            </div>
          )
        }
      }
    };


    this.buildColumns();
  }

  buildComplianceBadges(item) {
    const badgeList = [];
    const fields = ['pci_dss', 'gpg13', 'hipaa', 'gdpr', 'nist_800_53', 'tsc', 'mitre'];
    const buildBadge = field => {
      const idGenerator = () => {
        return (
          '_' +
          Math.random()
            .toString(36)
            .substr(2, 9)
        );
      };

      return (
        <EuiToolTip
          content={item[field].join(', ')}
          key={idGenerator()}
          position="bottom"
        >
          <EuiBadge
            title={null}
            color="hollow"
            onClick={ev => ev.stopPropagation()}
            onClickAriaLabel={field.toUpperCase()}
            style={{ margin: '1px 2px' }}
          >
            {field.toUpperCase()}
          </EuiBadge>
        </EuiToolTip>
      );
    };
    try {
      for (const field of fields) {
        if (item[field].length) {
          badgeList.push(buildBadge(field));
        }
      }
    } catch (error) { }

    return <div>{badgeList}</div>;
  }
}
