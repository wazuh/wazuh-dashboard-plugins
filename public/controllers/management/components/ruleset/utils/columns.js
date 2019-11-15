import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiLink, EuiButtonEmpty, EuiOverlayMask, EuiConfirmModal } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';


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
            sortable: false,
            width: '10%'
          },
          {
            field: 'pci',
            name: 'PCI',
            align: 'left',
            sortable: false,
            width: '10%'
          },
          {
            field: 'gdpr',
            name: 'GDPR',
            align: 'left',
            sortable: false,
            width: '10%'
          },
          {
            field: 'hipaa',
            name: 'HIPAA',
            align: 'left',
            sortable: false,
            width: '10%'
          },
          {
            field: 'nist-800-53',
            name: 'NIST 800-53',
            align: 'left',
            sortable: false,
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
                          aria-label="Delete content"
                          iconType="trash"
                          onClick={() => {
                            this.showConfirmDelete(item);
                          }}
                          color="danger"
                        />
                      </EuiToolTip>
                    </div>
                    {(this.removingItem === item.file) && (
                      <div>
                        <div>
                          <span>This file will be removed</span>
                        </div>
                        <div>
                          <EuiButtonEmpty onClick={() => this.removingItem = null}>
                            Cancel
                    </EuiButtonEmpty>
                          <EuiButtonEmpty
                            color="danger"
                            onClick={() => { this.confirmDelete(item.name); this.forceUpdate() }}>
                            Confirm
    </EuiButtonEmpty>
                        </div>
                      </div>
                    )}
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
              const defaultItems = this.tableProps.state.defaultItems;
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
                  <EuiToolTip position="top" content={(defaultItems.indexOf(`${item.path}/${item.name}`) === -1)? `Delete ${item.name}`: `The ${item.name} list cannot be deleted`}>
                    <EuiButtonIcon
                      aria-label="Show content"
                      iconType="trash"
                      onClick={async () => {
                        this.tableProps.updateListItemsForRemove([item]);
                        this.tableProps.updateShowModal(true);
                      }}
                      color="danger"
                      disabled={defaultItems.indexOf(`${item.path}/${item.name}`) !== -1}
                    />
                  </EuiToolTip>
                </div>
              )
            }
          }
        );
      }
    }

    this.confirmDelete = async (item) => {
      const filesGetter = item.path.includes('/rules') ? this.rulesetHandler.getRulesFiles : this.rulesetHandler.getDecodersFiles
      await this.rulesetHandler.deleteFile(item.file, item.path);
      this.tableProps.updateLoadingStatus(true);
      const items = await filesGetter();
      this.tableProps.updateItems(items);
      this.tableProps.updateLoadingStatus(false);
    }

    this.showConfirmDelete = (item) => {
      item.removingItem = true;
      /*       return (        
            <EuiOverlayMask>
              <EuiConfirmModal
                title={item.file}
                onCancel={this.closeModal}
                onConfirm={this.confirmDelete}
                cancelButtonText="No, don't do it"
                confirmButtonText="Yes, do it"
                defaultFocusedButton="confirm">
                <p>You&rsquo;re about to do something.</p>
                <p>Are you sure you want to do this?</p>
              </EuiConfirmModal>
            </EuiOverlayMask>); */
      this.removingItem = this.removingItem === item.file ? null : item.file;
      console.log(this.removingItem)
      this.buildColumns();
    }
    this.buildColumns();
  }
}