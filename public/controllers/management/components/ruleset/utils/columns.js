import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiLink } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';


export default class RulesetColumns {

  constructor(tableProps) {
    this.tableProps = tableProps;
    this.rulesetHandler = RulesetHandler;
    this.adminMode = this.tableProps.state.adminMode;
    this.columns = {
      rules: [
        {
          field: 'id',
          name: 'ID',
          align: 'left',
          sortable: true,
          width: '5%',
          render: (value, item) => {
            return (
              <EuiToolTip position="top" content={`Show rule ID ${value} information`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getRuleInformation(item.file, value);
                  this.tableProps.updateRuleInfo(result);
                }
                }>
                  {value}
                </EuiLink>
              </EuiToolTip>
            )
          }
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
          sortable: true,
          width: '10%'
        },
        {
          field: 'pci',
          name: 'PCI',
          align: 'left',
          sortable: true,
          width: '10%'
        },
        {
          field: 'gdpr',
          name: 'GDPR',
          align: 'left',
          sortable: true,
          width: '10%'
        },
        {
          field: 'hipaa',
          name: 'HIPAA',
          align: 'left',
          sortable: true,
          width: '10%'
        },
        {
          field: 'nist-800-53',
          name: 'NIST 800-53',
          align: 'left',
          sortable: true,
          width: '10%'
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
                <EuiLink onClick={async () => {
                  const noLocal = item.path.startsWith('ruleset/');
                  const result = await this.rulesetHandler.getRuleContent(value, noLocal);
                  const file = { name: value, content: result, path: item.path };
                  this.tableProps.updateFileContent(file);
                }
                }>
                  {value}
                </EuiLink>
              </EuiToolTip>
            )
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
          sortable: true,
          render: (value, item) => {
            return (
              <EuiToolTip position="top" content={`Show ${value} decoder information`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getDecoderInformation(item.file, value);
                  this.tableProps.updateDecoderInfo(result);
                }
                }>
                  {value}
                </EuiLink>
              </EuiToolTip>
            )
          }
        },
        {
          field: 'details.program_name',
          name: 'Program name',
          align: 'left',
          sortable: true
        },
        {
          field: 'details.order',
          name: 'Order',
          align: 'left',
          sortable: true
        },
        {
          field: 'file',
          name: 'File',
          align: 'left',
          sortable: true,
          render: (value, item) => {
            return (
              <EuiToolTip position="top" content={`Show ${value} content`}>
                <EuiLink onClick={async () => {
                  const noLocal = item.path.startsWith('ruleset/');
                  const result = await this.rulesetHandler.getDecoderContent(value, noLocal);
                  const file = { name: value, content: result, path: item.path };
                  this.tableProps.updateFileContent(file);
                }
                }>{value}</EuiLink>
              </EuiToolTip>
            )
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
          sortable: true,
          render: (value, item) => {
            return (
              <EuiToolTip position="top" content={`Show ${value} content`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getCdbList(`${item.path}/${item.name}`);
                  const file = { name: item.name, content: result, path: item.path };
                  this.tableProps.updateListContent(file);
                }}>
                  {value}
                </EuiLink>
              </EuiToolTip>
            )
          }
        },
        {
          field: 'path',
          name: 'Path',
          align: 'left',
          sortable: true
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
                <EuiToolTip position="top" content={`Show ${item.file} content`}>
                  <EuiButtonIcon
                    aria-label="Show content"
                    iconType="eye"
                    onClick={async () => {
                      const result = await this.rulesetHandler.getFileContent(`${item.path}/${item.file}`);
                      const file = { name: item.file, content: result, path: item.path };
                      this.tableProps.updateFileContent(file);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
              )
            } else {
              return (
                <div>
                  <EuiToolTip position="top" content={`Edit ${item.file} content`}>
                    <EuiButtonIcon
                      aria-label="Edit content"
                      iconType="pencil"
                      onClick={async () => {
                        const result = await this.rulesetHandler.getFileContent(`${item.path}/${item.file}`);
                        const file = { name: item.file, content: result, path: item.path };
                        this.tableProps.updateFileContent(file);
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                  <EuiToolTip position="top" content={`Remove ${item.file} file`}>
                    <EuiButtonIcon
                      aria-label="Show content"
                      iconType="trash"
                      onClick={async () => {
                        console.log(`deleting ${item.file}`);
                      }}
                      color="danger"
                    />
                  </EuiToolTip>
                </div>
              )
            }
          }
        }
      ]
    }
    // If the admin mode is enabled the action column in CDB lists is shown
    if (this.adminMode) {
      this.columns.lists.push(
        {
          name: 'Actions',
          align: 'left',
          render: item => {
            return (
              <div>
                <EuiToolTip position="top" content={`Edit ${item.name} content`}>
                  <EuiButtonIcon
                    aria-label="Edit content"
                    iconType="pencil"
                    onClick={async () => {
                      const result = await this.rulesetHandler.getCdbList(`${item.path}/${item.name}`);
                      const file = { name: item.name, content: result, path: item.path };
                      this.tableProps.updateListContent(file);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
                <EuiToolTip position="top" content={`Remove ${item.name}`}>
                  <EuiButtonIcon
                    aria-label="Show content"
                    iconType="trash"
                    onClick={async () => {
                      console.log(`deleting ${item.path}/${item.name}`);
                    }}
                    color="danger"
                  />
                </EuiToolTip>
              </div>
            )
          }
        }
      );
    }
  }
}