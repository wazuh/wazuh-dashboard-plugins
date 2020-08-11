import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiLink, EuiBadge } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';
import exportCsv from '../../../../../../react-services/wz-csv';

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
                <EuiToolTip position="top" content={`Show ${value} content`}>
                  <EuiLink onClick={async (ev) => {
                    ev.stopPropagation();
                    const noLocal = item.relative_dirname.startsWith('ruleset/');
                    const result = await this.rulesetHandler.getRuleContent(value, noLocal);
                    const file = { name: value, content: result, path: item.relative_dirname };
                    this.tableProps.updateFileContent(file);
                  }
                  }>
                    {value}
                  </EuiLink>
                </EuiToolTip>
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
                <EuiToolTip position="top" content={`Show ${value} content`}>
                  <EuiLink onClick={async (ev) => {
                    ev.stopPropagation();
                    const noLocal = item.relative_dirname.startsWith('ruleset/');
                    const result = await this.rulesetHandler.getDecoderContent(value, noLocal);
                    const file = { name: value, content: result, path: item.relative_dirname };
                    this.tableProps.updateFileContent(file);
                  }
                  }>{value}</EuiLink>
                </EuiToolTip>
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
                  <EuiToolTip position="top" content={`Show ${item.filename} content`}>
                    <EuiButtonIcon
                      aria-label="Show content"
                      iconType="eye"
                      onClick={async ev => {
                        ev.stopPropagation();
                        const result = await this.rulesetHandler.getFileContent(`${item.relative_dirname}/${item.filename}`);
                        const file = { name: item.filename, content: result, path: item.relative_dirname };
                        this.tableProps.updateFileContent(file);
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                );
              } else {
                return (
                  <div>
                    <EuiToolTip position="top" content={`Edit ${item.filename} content`}>
                      <EuiButtonIcon
                        aria-label="Edit content"
                        iconType="pencil"
                        onClick={async ev => {
                          ev.stopPropagation();
                          const result = await this.rulesetHandler.getFileContent(`${item.relative_dirname}/${item.filename}`);
                          const file = { name: item.filename, content: result, path: item.relative_dirname };
                          this.tableProps.updateFileContent(file);
                        }}
                        color="primary"
                      />
                    </EuiToolTip>
                    <EuiToolTip position="top" content={`Remove ${item.filename} file`}>
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
      if (this.tableProps.adminMode) {
        this.columns.lists[2] =
          {
            name: 'Actions',
            align: 'left',
            render: item => {
              const defaultItems = this.tableProps.state.defaultItems;
              return (
                <div>
                  <EuiToolTip position="top" content={`Edit ${item.filename} content`}>
                    <EuiButtonIcon
                      aria-label="Edit content"
                      iconType="pencil"
                      onClick={async (ev) => {
                        ev.stopPropagation();
                        const result = await this.rulesetHandler.getCdbList(`${item.relative_dirname}/${item.filename}`);
                        const file = { name: item.filename, content: result, path: item.relative_dirname };
                        this.tableProps.updateListContent(file);
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                  <EuiToolTip position="top" content={(defaultItems.indexOf(`${item.relative_dirname}`) === -1) ? `Delete ${item.filename}` : `The ${item.filename} list cannot be deleted`}>
                    <EuiButtonIcon
                      aria-label="Show content"
                      iconType="trash"
                      onClick={async (ev) => {
                        ev.stopPropagation();
                        this.tableProps.updateListItemsForRemove([item]);
                        this.tableProps.updateShowModal(true);
                      }}
                      color="danger"
                      disabled={defaultItems.indexOf(`${item.relative_dirname}`) !== -1}
                    />
                  </EuiToolTip>
                  <EuiToolTip position="top" content={`Export ${item.filename}`}>
                    <EuiButtonIcon
                      aria-label="Export list"
                      iconType="exportAction"
                      onClick={async (ev) => {
                        ev.stopPropagation();
                        await exportCsv(`/lists`, [{_isCDBList: true, name: 'filename', value: `${item.filename}`}], item.filename)
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                </div>
              )
            }
          }
        };
      }

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
