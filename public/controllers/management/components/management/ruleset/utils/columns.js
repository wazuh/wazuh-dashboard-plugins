import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiLink, EuiBadge } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';
import exportCsv from '../../../../../../react-services/wz-csv';

export default class RulesetColumns {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.rulesetHandler = RulesetHandler;
    this.adminMode = this.tableProps.state.adminMode;

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
            width: '30%'
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
            field: 'file',
            name: 'File',
            align: 'left',
            sortable: true,
            width: '15%',
            render: (value, item) => {
              return (
                <EuiToolTip position="top" content={`Show ${value} content`}>
                  <EuiLink
                    onClick={async ev => {
                      ev.stopPropagation();
                      const noLocal = item.path.startsWith('ruleset/');
                      const result = await this.rulesetHandler.getRuleContent(
                        value,
                        noLocal
                      );
                      const file = {
                        name: value,
                        content: result,
                        path: item.path
                      };
                      this.tableProps.updateFileContent(file);
                    }}
                  >
                    {value}
                  </EuiLink>
                </EuiToolTip>
              );
            }
          },
          {
            field: 'path',
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
            field: 'file',
            name: 'File',
            align: 'left',
            sortable: true,
            render: (value, item) => {
              return (
                <EuiToolTip position="top" content={`Show ${value} content`}>
                  <EuiLink
                    onClick={async ev => {
                      ev.stopPropagation();
                      const noLocal = item.path.startsWith('ruleset/');
                      const result = await this.rulesetHandler.getDecoderContent(
                        value,
                        noLocal
                      );
                      const file = {
                        name: value,
                        content: result,
                        path: item.path
                      };
                      this.tableProps.updateFileContent(file);
                    }}
                  >
                    {value}
                  </EuiLink>
                </EuiToolTip>
              );
            }
          },
          {
            field: 'path',
            name: 'Path',
            align: 'left',
            sortable: true
          }
        ],
        lists: [
          {
            field: 'name',
            name: 'Name',
            align: 'left',
            sortable: true
          },
          {
            field: 'path',
            name: 'Path',
            align: 'left',
            sortable: true
          },
          {
            name: 'Actions',
            align: 'left',
            render: item => (
              <EuiToolTip position="top" content={`Export ${item.name}`}>
                <EuiButtonIcon
                  aria-label="Export list"
                  iconType="exportAction"
                  onClick={async ev => {
                    ev.stopPropagation();
                    await exportCsv(
                      `/lists?path=${item.path}/${item.name}`,
                      [
                        {
                          _isCDBList: true,
                          name: 'path',
                          value: `${item.path}/${item.name}`
                        }
                      ],
                      item.name
                    );
                  }}
                  color="primary"
                />
              </EuiToolTip>
            )
          }
        ],
        files: [
          {
            field: 'file',
            name: 'File',
            align: 'left',
            sortable: true
          },
          {
            name: 'Actions',
            align: 'left',
            render: item => {
              if (item.path.startsWith('ruleset/')) {
                return (
                  <EuiToolTip
                    position="top"
                    content={`Show ${item.file} content`}
                  >
                    <EuiButtonIcon
                      aria-label="Show content"
                      iconType="eye"
                      onClick={async ev => {
                        ev.stopPropagation();
                        const result = await this.rulesetHandler.getFileContent(
                          `${item.path}/${item.file}`
                        );
                        const file = {
                          name: item.file,
                          content: result,
                          path: item.path
                        };
                        this.tableProps.updateFileContent(file);
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                );
              } else {
                return (
                  <div>
                    <EuiToolTip
                      position="top"
                      content={`Edit ${item.file} content`}
                    >
                      <EuiButtonIcon
                        aria-label="Edit content"
                        iconType="pencil"
                        onClick={async ev => {
                          ev.stopPropagation();
                          const result = await this.rulesetHandler.getFileContent(
                            `${item.path}/${item.file}`
                          );
                          const file = {
                            name: item.file,
                            content: result,
                            path: item.path
                          };
                          this.tableProps.updateFileContent(file);
                        }}
                        color="primary"
                      />
                    </EuiToolTip>
                    <EuiToolTip
                      position="top"
                      content={`Remove ${item.file} file`}
                    >
                      <EuiButtonIcon
                        aria-label="Delete content"
                        iconType="trash"
                        onClick={ev => {
                          ev.stopPropagation();
                          this.tableProps.updateListItemsForRemove([item]);
                          this.tableProps.updateShowModal(true);
                        }}
                        color="danger"
                      />
                    </EuiToolTip>
                  </div>
                );
              }
            }
          }
        ]
      };
      // If the admin mode is enabled the action column in CDB lists is shown
      if (this.adminMode) {
        this.columns.lists[2] = {
          name: 'Actions',
          align: 'left',
          render: item => {
            const defaultItems = this.tableProps.state.defaultItems;
            return (
              <div>
                <EuiToolTip
                  position="top"
                  content={`Edit ${item.name} content`}
                >
                  <EuiButtonIcon
                    aria-label="Edit content"
                    iconType="pencil"
                    onClick={async ev => {
                      ev.stopPropagation();
                      const result = await this.rulesetHandler.getCdbList(
                        `${item.path}/${item.name}`
                      );
                      const file = {
                        name: item.name,
                        content: result,
                        path: item.path
                      };
                      this.tableProps.updateListContent(file);
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
                    aria-label="Show content"
                    iconType="trash"
                    onClick={async ev => {
                      ev.stopPropagation();
                      this.tableProps.updateListItemsForRemove([item]);
                      this.tableProps.updateShowModal(true);
                    }}
                    color="danger"
                    disabled={
                      defaultItems.indexOf(`${item.path}/${item.name}`) !== -1
                    }
                  />
                </EuiToolTip>
                <EuiToolTip position="top" content={`Export ${item.name}`}>
                  <EuiButtonIcon
                    aria-label="Export list"
                    iconType="exportAction"
                    onClick={async ev => {
                      ev.stopPropagation();
                      await exportCsv(
                        `/lists?path=${item.path}/${item.name}`,
                        [
                          {
                            _isCDBList: true,
                            name: 'path',
                            value: `${item.path}/${item.name}`
                          }
                        ],
                        item.name
                      );
                    }}
                    color="primary"
                  />
                </EuiToolTip>
              </div>
            );
          }
        };
      }
    };

    this.buildColumns();
  }

  buildComplianceBadges(item) {
    const badgeList = [];
    const fields = ['pci', 'gpg13', 'hipaa', 'gdpr', 'nist-800-53', 'tsc'];
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
