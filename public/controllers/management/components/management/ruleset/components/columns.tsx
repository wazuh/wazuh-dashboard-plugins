import React from 'react';
import { EuiToolTip, EuiBadge } from '@elastic/eui';
import { resourceDictionary, ResourcesHandler, ResourcesConstants } from '../../common/resources-handler';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { UIErrorLog, UILogLevel, UIErrorSeverity, UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { WzButtonPermissionsModalConfirm } from '../../../../../../components/common/buttons';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { UIErrorLog } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOptions } from '../../common/error-helper';

export default class RulesetColumns {
  props: any;
  constructor(props) {
    this.props = props;

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
              if (value === undefined) return '';
              const regex = /\$(.*?)\)/g;
              let result = value.match(regex);
              let haveTooltip = false;
              let toolTipDescription = false;
              if (result !== null) {
                haveTooltip = true;
                toolTipDescription = value;
                for (const oldValue of result) {
                  let newValue = oldValue.replace('$(', `<strong style="color:#006BB4">`);
                  newValue = newValue.replace(')', ' </strong>');
                  value = value.replace(oldValue, newValue);
                }
              }
              return (
                <div>
                  {haveTooltip === false ?
                    <span dangerouslySetInnerHTML={{ __html: value }} /> :
                    <EuiToolTip position="bottom" content={toolTipDescription}>
                      <span dangerouslySetInnerHTML={{ __html: value }} />
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
                  permissions={getReadButtonPermissions(item)}
                  tooltip={{ position: 'top', content: `Show ${value} content` }}
                  onClick={async (ev) => {
                    try{
                      ev.stopPropagation();
                      const rulesetHandler = new RulesetHandler(RulesetResources.RULES);
                      const result = await rulesetHandler.getFileContent(value);
                      const file = { name: value, content: result, path: item.relative_dirname };
                      this.props.updateFileContent(file);
                    }catch(error){
                      const options: UIErrorLog = this.getErrorOptions(
                        error,
                        'Rules.readFileContent'
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
            sortable: true,
            width: '10%'
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
                      try{
                        ev.stopPropagation();
                        const rulesetHandler = new RulesetHandler(this.props.state.section);
                        const result = await rulesetHandler.getFileContent(item.filename);
                        const file = { name: item.filename, content: result, path: item.relative_dirname };
                        this.props.updateFileContent(file);
                      }catch(error){
                        const options: UIErrorLog = this.getErrorOptions(
                          error,
                          'Files.readFileContent'
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
                          const rulesetHandler = new RulesetHandler(this.props.state.section);
                          const result = await rulesetHandler.getFileContent(item.filename);
                          const file = { name: item.filename, content: result, path: item.relative_dirname };
                          this.props.updateFileContent(file);
                        } catch (error) {
                          const options: UIErrorLog = this.getErrorOptions(
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
                      tooltip={{ position: 'top', content: `Remove ${item.filename} file` }}
                      onClick={ev => {
                        try{
                          ev.stopPropagation();
                          this.props.updateListItemsForRemove([item]);
                          this.props.updateShowModal(true);
                        }catch(error){
                          const options: UIErrorLog = this.getErrorOptions(
                            error,
                            'Files.deleteFile'
                          );
                          getErrorOrchestrator().handleError(options);
                        }
                      }}
                      onConfirm={async () => {
                        try {
                          this.props.removeItems([item]);
                        } catch (error) {
                          const options: UIErrorLog = this.getErrorOptions(
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
        const { permissionResource } = resourceDictionary[ResourcesConstants.RULES];
        return [
          {
            action: `${ResourcesConstants.RULES}:read`,
            resource: permissionResource(item.filename),
          },
        ];
      };

      const getEditButtonPermissions = (item) => {
        const { permissionResource } = resourceDictionary[ResourcesConstants.RULES];
        return [
          {
            action: `${ResourcesConstants.RULES}:read`,
            resource: permissionResource(item.filename),
          },
          { action: `${ResourcesConstants.RULES}:update`, resource: permissionResource(item.filename) },
        ];
      };

      const getDeleteButtonPermissions = (item) => {
        const { permissionResource } = resourceDictionary[ResourcesConstants.RULES];
        return [
          {
            action: `${ResourcesConstants.RULES}:delete`,
            resource: permissionResource(item.filename),
          },
        ];
      };
    };

    this.buildColumns();
  }

  /**
   * Build and return a new error options object, based on the actual error
   * and the context
   * @param error raised error
   * @param context context of the error
   * @returns a dictionary with the error details for the ErrorOrchestator
   */
  private getErrorOptions(error: unknown, context: string): UIErrorLog {
    return {
      context: context,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
      error: {
        error: error,
        message: error.message || error,
        title: error.name,
      },
    };
  }

  buildComplianceBadges(item) {
    const badgeList = [];
    const fields = ['pci_dss', 'gpg13', 'hipaa', 'gdpr', 'nist_800_53', 'tsc', 'mitre'];
    const buildBadge = field => {

      return (
        <EuiToolTip
          content={item[field].join(', ')}
          key={`${item.id}-${field}`}
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
