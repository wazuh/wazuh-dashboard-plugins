import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiLink } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';


export default class RulesetColumns {

  constructor(tableProps) {
    this.tableProps = tableProps;
    this.rulesetHandler = RulesetHandler;
    this.columns = {
      rules: [
        {
          name: 'ID',
          align: 'left',
          sortable: true,
          width: '5%',
          render: item => {
            return (
              <EuiToolTip position="top" content={`Show rule ID ${item.id} information`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getRuleInformation(item.file, item.id);
                  this.tableProps.updateRuleInfo(result);
                }
                }>
                  {item.id}
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
          render: item => {
            return (
              <EuiToolTip position="top" content={`Show ${item} content`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getRuleContent(item);
                  const file = { name: item, content: result };
                  this.tableProps.updateFileContent(file);
                }
                }>
                  {item}
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
          name: 'Name',
          align: 'left',
          sortable: true,
          render: item => {
            return (
              <EuiToolTip position="top" content={`Show ${item.name} decoder information`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getDecoderInformation(item.file, item.name);
                  this.tableProps.updateDecoderInfo(result);
                }
                }>
                  {item.name}
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
          render: item => {
            return (
              <EuiToolTip position="top" content={`Show ${item} content`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getDecoderContent(item);
                  const file = { name: item, content: result };
                  this.tableProps.updateFileContent(file);
                }
                }>{item}</EuiLink>
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
          name: 'Name',
          align: 'left',
          sortable: true,
          render: item => {
            return (
              <EuiToolTip position="top" content={`Show ${item.name} content`}>
                <EuiLink onClick={async () => {
                  const result = await this.rulesetHandler.getCdbList(`${item.path}/${item.name}`);
                  console.log(result)
                }
                }>
                  {item.name}
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
        },
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
                      console.log(result)
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
        },

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
                      const file = { name: item.file, content: result };
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
                        const file = { name: item.file, content: result };
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
  }
}