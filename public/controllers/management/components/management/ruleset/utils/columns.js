import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiLink, EuiBadge } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';
import exportCsv from '../../../../../../react-services/wz-csv';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';

export default class RulesetColumns {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.rulesetHandler = RulesetHandler;

    this.buildColumns = () => {
      this.columns = {
        rules: [
          {
            field: 'id',
            name: 'ID',
            align: 'left',
            sortable: true,
            width: '5%'
          },
          {
            field: 'description',
            name: 'Description',
            align: 'left',
            sortable: true,
            width: '30%',
            render: (value, item) => {
              if(value === undefined) return '';
              const regex = /\$(.*?)\)/g;
              let result = value.match(regex);
              let haveTooltip = false;
              let toolTipDescription = false;
              if(result !== null) {
                haveTooltip = true;
                toolTipDescription = value;
                for (const oldValue of result) {
                  let newValue = oldValue.replace('$(',`<strong style="color:#006BB4">`);
                  newValue = newValue.replace(')', ' </strong>');
                  value = value.replace(oldValue, newValue);
                }
              }
              return (
              <div>
                {haveTooltip === false ?
                <span dangerouslySetInnerHTML={{ __html: value}} /> :
                <EuiToolTip position="bottom" content={toolTipDescription}>
                  <span dangerouslySetInnerHTML={{ __html: value}} />
                </EuiToolTip>
                }
              </div>
              );
            }
          },
          {
            field: 'groups',
            name: 'Groups',
            align: 'left',
            sortable: false,
            width: '10%'
          },
          {
            name: 'Regulatory compliance',
            render: this.buildComplianceBadges
          },
          {
            field: 'level',
            name: 'Level',
            align: 'left',
            sortable: true,
            width: '5%'
          },
          {
            field: 'filename',
            name: 'File',
            align: 'left',
            sortable: true,
            width: '15%',
            render: (value, item) => {
              return (
                <WzButtonPermissions
                  buttonType='link'
                  permissions={[[{action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read_file`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, {action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, { action: 'rules:read', resource: `rule:file:${item.filename}`}]]}
                  tooltip={{position:'top', content: `Show ${value} content`}}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    const noLocal = item.relative_dirname.startsWith('ruleset/');
                    const result = await this.rulesetHandler.getRuleContent(value, noLocal);
                    const file = { name: value, content: result, path: item.relative_dirname };
                    this.tableProps.updateFileContent(file);
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
            sortable: true,
            width: '10%'
          }
        ],
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
                  permissions={[[{action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read_file`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, {action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, { action: 'decoders:read', resource: `decoder:file:${item.filename}`}]]}
                  tooltip={{position:'top', content: `Show ${value} content`}}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    const noLocal = item.relative_dirname.startsWith('ruleset/');
                    const result = await this.rulesetHandler.getDecoderContent(value, noLocal);
                    const file = { name: value, content: result, path: item.relative_dirname };
                    this.tableProps.updateFileContent(file);
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
                    await exportCsv(`/lists?path=${item.relative_dirname}/${item.filename}`, [{_isCDBList: true, name: 'path', value: `${item.relative_dirname}/${item.filename}`}], item.filename)
                  }}
                  color="primary"
                />
              </EuiToolTip>
            )
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
                    permissions={[[{action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read_file`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, {action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, { action: 'lists:read', resource: `list:path:${item.filename}`}]]}
                    aria-label="Show content"
                    iconType="eye"
                    tooltip={{position: 'top', content:`Edit ${item.filename} content`}}
                    onClick={async ev => {
                      ev.stopPropagation();
                      const result = await this.rulesetHandler.getFileContent(`${item.relative_dirname}/${item.filename}`);
                      const file = { name: item.filename, content: result, path: item.relative_dirname };
                      this.tableProps.updateFileContent(file);
                    }}
                    color="primary"
                  />
                );
              } else {
                return (
                  <div>
                    <WzButtonPermissions
                      buttonType='icon'
                      permissions={[[{action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read_file`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, {action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read`, resource: `file:path:${item.relative_dirname}/${item.filename}`}, { action: 'lists:read', resource: `list:path:${item.filename}`}]]}
                      aria-label="Edit content"
                      iconType="pencil"
                      tooltip={{position: 'top', content:`Edit ${item.filename} content`}}
                      onClick={async ev => {
                        ev.stopPropagation();
                        const result = await this.rulesetHandler.getFileContent(`${item.relative_dirname}/${item.filename}`);
                        const file = { name: item.filename, content: result, path: item.relative_dirname };
                        this.tableProps.updateFileContent(file);
                      }}
                      color="primary"
                    />
                    <WzButtonPermissions
                      buttonType='icon'
                      permissions={[{action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:delete_file`, resource: `file:path:${item.relative_dirname}/${item.filename}`}]}
                      aria-label="Delete content"
                      iconType="trash"
                      tooltip={{position: 'top', content:`Remove ${item.filename} file`}}
                      onClick={ev => {
                        ev.stopPropagation();
                        this.tableProps.updateListItemsForRemove([item]);
                        this.tableProps.updateShowModal(true);
                      }}
                      color="danger"
                    />
                  </div>
                );
              }
            }
          }
        ]
      };

      const getEditButtonPermissions = (item) => {
        const permissions = [
          {
            action: `${
              ((this.tableProps || {}).clusterStatus || {}).contextConfigServer
            }:read_file`,
            resource: `file:path:${item.relative_dirname}/${item.filename}`,
          },
          { action: 'lists:read', resource: `list:path:${item.filename}` },
          {
            action: `cluster:status`,
            resource: `*:*:*`,
          },
        ];

        if (((this.tableProps || {}).clusterStatus || {}).contextConfigServer === 'cluster') {
          permissions.push(
            {
              action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read`,
              resource: `node:id:*`,
            },
            {
              action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read_file`,
              resource: `node:id:*&file:path:*`,
            }
          );
        } else {
          permissions.push({
            action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:read`,
            resource: `*:*:*`,
          });
        }

        return permissions;
      };

      this.columns.lists[2] =
        {
          name: 'Actions',
          align: 'left',
          render: item => {
            const defaultItems = this.tableProps.state.defaultItems;
            return (
              <div>
                <WzButtonPermissions
                  buttonType='icon'
                  permissions={getEditButtonPermissions(item)}
                  aria-label="Edit content"
                  iconType="pencil"
                  tooltip={{position: 'top', content: `Edit ${item.filename} content`}}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    const result = await this.rulesetHandler.getCdbList(`${item.relative_dirname}/${item.filename}`);
                    const file = { name: item.filename, content: result, path: item.relative_dirname };
                    this.tableProps.updateListContent(file);
                  }}
                  color="primary"
                />
                <WzButtonPermissions
                  buttonType='icon'
                  permissions={[{action: `${((this.tableProps || {}).clusterStatus || {}).contextConfigServer}:delete_file`, resource: `file:path:${item.relative_dirname}/${item.filename}`}]}
                  aria-label="Show content"
                  iconType="trash"
                  tooltip={{position: 'top', content:(defaultItems.indexOf(`${item.relative_dirname}`) === -1) ? `Delete ${item.filename}` : `The ${item.filename} list cannot be deleted`}}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    this.tableProps.updateListItemsForRemove([item]);
                    this.tableProps.updateShowModal(true);
                  }}
                  color="danger"
                  isDisabled={defaultItems.indexOf(`${item.relative_dirname}`) !== -1}
                />
                <WzButtonPermissions
                  buttonType='icon'
                  permissions={getEditButtonPermissions(item)}
                  aria-label="Export list"
                  iconType="exportAction"
                  tooltip={{position: 'top', content: `Edit ${item.filename} content`}}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    await exportCsv(`/lists`, [{_isCDBList: true, name: 'filename', value: `${item.filename}`}], item.filename)
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
    } catch (error) {}

    return <div>{badgeList}</div>;
  }
}
