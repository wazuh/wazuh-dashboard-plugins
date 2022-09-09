import React, { Component } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiToolTip,
  EuiBadge,
  EuiSpacer,
  EuiLink,
  EuiAccordion,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiLoadingSpinner,
} from '@elastic/eui';

import { WzRequest } from '../../../../../../react-services/wz-request';

import { ResourcesHandler, ResourcesConstants } from '../../common/resources-handler';
import WzTextWithTooltipTruncated from '../../../../../../components/common/wz-text-with-tooltip-if-truncated';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

export default class WzRuleInfo extends Component {
  constructor(props) {
    super(props);
    this.complianceEquivalences = {
      pci: 'PCI DSS',
      gdpr: 'GDPR',
      gpg13: 'GPG 13',
      hipaa: 'HIPAA',
      'nist-800-53': 'NIST-800-53',
      tsc: 'TSC',
      mitreTactics: 'MITRE Tactics',
      mitreTechniques: 'MITRE Techniques',
      mitre: 'MITRE',
    };
    this.state = {
      mitreTactics: [],
      mitreLoading: false,
      mitreTechniques: [],
      mitreRuleId: '',
      mitreIds: [],
      currentRuleInfo: {},
      isLoading: true
    };
    this.resourcesHandler = new ResourcesHandler(ResourcesConstants.RULES);

    const handleFileClick = async (event, { filename, relative_dirname }) => {
      event.stopPropagation();
      try {
        const result = await this.resourcesHandler.getFileContent(filename);
        const file = {
          name: filename,
          content: result,
          path: relative_dirname,
        };
        this.props.updateFileContent(file);
      } catch (error) {
        const options = {
          context: `${WzRuleInfo.name}.handleFileClick`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: `Error updating file content: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    this.columns = [
      {
        field: 'id',
        name: 'ID',
        align: 'left',
        sortable: true,
        width: '5%',
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
          if (result !== null) {
            for (const oldValue of result) {
              let newValue = oldValue.replace('$(', `<strong style="color:#006BB4">`);
              newValue = newValue.replace(')', ' </strong>');
              value = value.replace(oldValue, newValue);
            }
          }
          return (
            <div>
              <span dangerouslySetInnerHTML={{ __html: value }} />
            </div>
          );
        },
      },
      {
        field: 'groups',
        name: 'Groups',
        align: 'left',
        sortable: true,
        width: '10%',
      },
      {
        name: 'Compliance',
        render: this.buildComplianceBadges,
      },
      {
        field: 'level',
        name: 'Level',
        align: 'left',
        sortable: true,
        width: '5%',
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
              <EuiLink onClick={async (event) => handleFileClick(event, item)}>{value}</EuiLink>
            </EuiToolTip>
          );
        },
      },
    ];
  }

  async componentDidMount() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

    this.setState({
      currentRuleId: this.props.item,
      isLoading: true,
      mitreLoading: true,
    });
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.currentRuleId !== this.state.currentRuleId)
      await this.loadRule()
  }

  async loadRule() {
    const { currentRuleId, mitreRuleId } = this.state;
    try {
      let mitreState = {};
      const result = await this.resourcesHandler.getResource({
        params: {
          rule_ids: currentRuleId,
        },
      });
      const currentRule = result?.data?.affected_items?.length ? result.data.affected_items[0] : {};

      const compliance = this.buildCompliance(currentRule);
      if (compliance?.mitre?.length && currentRuleId !== mitreRuleId) {
        mitreState = this.addMitreInformation(compliance.mitre, currentRuleId);
      } else if (currentRuleId !== mitreRuleId) {
        mitreState = {
          mitreLoading: false,
          mitreRuleId: currentRuleId,
          mitreIds: [],
          mitreTactics: [],
          mitreTechniques: [],
        }
      }

      this.setState({
        currentRuleInfo: currentRule,
        compliance: compliance,
        isLoading: false,
        ...mitreState
      });
    } catch (error) {
      const options = {
        context: `${WzRuleInfo.name}.handleFileClick`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: `Error updating file content: ${error.message || error}`,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }

  }
  /**
   * Build an object with the compliance info about a rule
   * @param {Object} ruleInfo
   */
  buildCompliance(ruleInfo) {
    const compliance = {};
    const complianceKeys = ['gdpr', 'gpg13', 'hipaa', 'nist-800-53', 'pci', 'tsc', 'mitre'];
    Object.keys(ruleInfo).forEach((key) => {
      if (complianceKeys.includes(key) && ruleInfo[key].length) compliance[key] = ruleInfo[key];
    });
    return compliance || {};
  }

  buildComplianceBadges(item) {
    const badgeList = [];
    const fields = ['pci_dss', 'gpg13', 'hipaa', 'gdpr', 'nist_800_53', 'tsc', 'mitre'];
    const buildBadge = (field) => {
      
      return (
        <EuiToolTip content={item[field].join(', ')} key={`${item.id}-${field}`} position="bottom">
          <EuiBadge
            title={null}
            onClick={(ev) => ev.stopPropagation()}
            onClickAriaLabel={field.toUpperCase()}
            color="hollow"
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
    } catch (error) {
      const options = {
        context: `${WzRuleInfo.name}.buildComplianceBadges`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        }
      };
      getErrorOrchestrator().handleError(options);
    }

    return <div>{badgeList}</div>;
  }

  /**
   * Clean the existing filters and sets the new ones and back to the previous section
   */
  setNewFiltersAndBack(filters) {
    window.history.pushState("",
      window.document.title,
      window.location.href.replace(new RegExp('&redirectRule=' + '[^&]*'), '')
    );
    this.props.cleanFilters();
    this.props.onFiltersChange(filters);
    this.props.closeFlyout();
  }

  /**
   * Render the basic information in a list
   * @param {Number} id
   * @param {Number} level
   * @param {String} file
   * @param {String} path
   */
  renderInfo(id = '', level = '', file = '', path = '', groups = []) {
    return (
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key="rule_ids" grow={1}>
          <b style={{ paddingBottom: 6 }}>ID</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this rule ID: ${id}`}>
              <EuiLink
                onClick={async () => this.setNewFiltersAndBack([{ field: 'rule_ids', value: id }])}
              >
                {id}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="level" grow={1}>
          <b style={{ paddingBottom: 6 }}>Level</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
              <EuiLink
                onClick={async () => this.setNewFiltersAndBack([{ field: 'level', value: level }])}
              >
                {level}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="file" grow={1}>
          <b style={{ paddingBottom: 6 }}>File</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this file: ${file}`}>
              <EuiLink
                onClick={async () =>
                  this.setNewFiltersAndBack([{ field: 'filename', value: file }])
                }
              >
                {file}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="path" grow={1}>
          <b style={{ paddingBottom: 6 }}>Path</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this path: ${path}`}>
              <EuiLink
                onClick={async () =>
                  this.setNewFiltersAndBack([{ field: 'relative_dirname', value: path }])
                }
              >
                {path}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="Groups" grow={1}>
          <b style={{ paddingBottom: 6 }}>Groups</b>
          {this.renderGroups(groups)}
        </EuiFlexItem>
        <EuiSpacer size="s" />
      </EuiFlexGrid>
    );
  }

  getFormattedDetails(value) {
    if (Array.isArray(value) && value[0].type) {
      let link = '';
      let name = '';

      value.forEach((item) => {
        if (item.type === 'cve') name = item.name;
        if (item.type === 'link')
          link = (
            <a href={item.name} target="_blank">
              {item.name}
            </a>
          );
      });
      return (
        <span>
          {name}: {link}
        </span>
      );
    } else if (value && typeof value === 'object' && value.constructor === Object) {
      let list = [];
      Object.keys(value).forEach((key, idx) => {
        list.push(
          <span key={key}>
            {key}:&nbsp;
            {value[key]}
            {idx < Object.keys(value).length - 1 && ', '}
            <br />
          </span>
        );
      });
      return (
        <ul>
          <li>{list}</li>
        </ul>
      );
    } else {
      return <WzTextWithTooltipTruncated position="top">{value}</WzTextWithTooltipTruncated>;
    }
  }

  /**
   * Render a list with the details
   * @param {Array} details
   */
  renderDetails(details = {}) {
    const detailsToRender = [];

    // Exclude group key of details
    Object.keys(details)
      .filter((key) => key !== 'group')
      .forEach((key) => {
        detailsToRender.push(
          <EuiFlexItem key={key} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
            <b className="wz-txt-capitalize" style={{ paddingBottom: 6 }}>{key}</b>
            {details[key] === '' ? 'true' : this.getFormattedDetails(details[key])}
          </EuiFlexItem>
        );
      });
    return <EuiFlexGrid columns={4}>{detailsToRender}</EuiFlexGrid>;
  }

  /**
   * Render the groups
   * @param {Array} groups
   */
  renderGroups(groups) {
    const listGroups = [];
    groups.forEach((group, index) => {
      listGroups.push(
        <span key={group}>
          <EuiLink
            onClick={async () => this.setNewFiltersAndBack([{ field: 'group', value: group }])}
          >
            <EuiToolTip position="top" content={`Filter by this group: ${group}`}>
              <span>{group}</span>
            </EuiToolTip>
          </EuiLink>
          {index < groups.length - 1 && ', '}
        </span>
      );
    });
    return (
      <ul>
        <li>{listGroups}</li>
      </ul>
    );
  }

  async getTacticsNames(tactics) {
    try {
      let tacticsObj = [];
      const data = await WzRequest.apiReq('GET', '/mitre/tactics', {
        params: {
          tactic_ids: tactics.toString(),
        },
      });
      const formattedData = ((data || {}).data.data || {}).affected_items || [] || {};
      formattedData &&
        formattedData.forEach((item) => {
          tacticsObj.push(item.name);
        });
      return tacticsObj;
    } catch (error) {
      return [];
    }
  }

  async addMitreInformation(compliance, currentRuleId) {
    let newMitreState = {};
    try {
      Object.assign(newMitreState, { mitreRuleId: currentRuleId });
      const mitreName = [];
      const mitreIds = [];
      const mitreTactics = await Promise.all(
        compliance.map(async (i) => {
          const data = await WzRequest.apiReq('GET', '/mitre/techniques', {
            params: {
              q: `external_id=${i}`,
            },
          });
          const formattedData = (((data || {}).data.data || {}).affected_items || [])[0] || {};
          const tactics = this.getTacticsNames(formattedData.tactics) || [];
          mitreName.push(formattedData.name);
          mitreIds.push(i);
          return tactics;
        })
      );
      if (mitreTactics.length) {
        let removeDuplicates = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
        const uniqueTactics = removeDuplicates(mitreTactics.flat());
        Object.assign(newMitreState, {
          mitreRuleId: currentRuleId,
          mitreIds,
          mitreTactics: uniqueTactics,
          mitreTechniques: mitreName,
        });
      }
    } catch (error) {
      Object.assign(newMitreState, { mitreLoading: false });
      const options = {
        context: `${WzRuleInfo.name}.addMitreInformation`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    return newMitreState;
  }

  /**
   * Render the compliance(HIPAA, NIST...)
   * @param {Array} compliance
   */
  renderCompliance(compliance) {
    const currentRuleId =
      this.state && this.state.currentRuleId
        ? this.state.currentRuleId
        : this.props.state.ruleInfo.current;



    const listCompliance = [];
    if (compliance.mitre) delete compliance.mitre;
    const keys = Object.keys(compliance);
    for (let i in Object.keys(keys)) {
      const key = keys[i];

      const values = compliance[key].map((element, index) => {
        return (
          <span key={index}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack([{ field: key, value: element }])}
            >
              <EuiToolTip position="top" content="Filter by this compliance">
                <span>{element}</span>
              </EuiToolTip>
            </EuiLink>
            {index < compliance[key].length - 1 && ', '}
          </span>
        );
      });

      listCompliance.push(
        <EuiFlexItem key={key} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{this.complianceEquivalences[key]}</b>
          <p>{values}</p>
          <EuiSpacer size="s" />
        </EuiFlexItem>
      );
    }

    if (this.state.mitreTechniques && this.state.mitreTechniques.length) {
      const values = this.state.mitreTechniques.map((element, index) => {
        return (
          <span key={index}>
            <EuiLink
              onClick={async () =>
                this.setNewFiltersAndBack([{ field: 'mitre', value: this.state.mitreIds[index] }])
              }
            >
              <EuiToolTip position="top" content="Filter by this compliance">
                <span>{element}</span>
              </EuiToolTip>
            </EuiLink>
            {index < this.state.mitreTechniques.length - 1 && ', '}
          </span>
        );
      });
      listCompliance.push(
        <EuiFlexItem key={listCompliance.length} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{this.complianceEquivalences['mitreTechniques']}</b>
          {(this.state.mitreLoading && <EuiLoadingSpinner size="m" />) || <p>{values}</p>}
          <EuiSpacer size="s" />
        </EuiFlexItem>
      );
    }

    if (this.state.mitreTactics && this.state.mitreTactics.length) {
      listCompliance.push(
        <EuiFlexItem key={listCompliance.length} grow={1} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{this.complianceEquivalences['mitreTactics']}</b>
          <p>{this.state.mitreTactics.toString()}</p>
          <EuiSpacer size="s" />
        </EuiFlexItem>
      );
    }

    return <EuiFlexGrid columns={4}>{listCompliance}</EuiFlexGrid>;
  }

  /**
   * Changes between rules
   * @param {Number} ruleId
   */
  changeBetweenRules(ruleId) {
    // Prevent reloading the same rule
    if (this.state.currentRuleId == ruleId) {
      return;
    }

    window.location.href = window.location.href.replace(
      new RegExp('redirectRule=' + '[^&]*'),
      `redirectRule=${ruleId}`
    );
    this.setState({ currentRuleId: ruleId, isLoading: true });
  }

  /**
   * Update style for title with elements $()
   * @param {string} value
   */
  updateStyleTitle(value) {
    if (value === undefined) return '';
    const regex = /\$(.*?)\)/g;
    let result = value.match(regex);
    if (result !== null) {
      for (const oldValue of result) {
        let newValue = oldValue.replace('$(', `<span style="color:#006BB4">`);
        newValue = newValue.replace(')', ' </span>');
        value = value.replace(oldValue, newValue);
      }
    }
    return value;
  }

  onClickRow = (item) => {
    return {
      onClick: () => {
        this.changeBetweenRules(item.id);
      },
    };
  };

  render() {
    const { description, details, filename, relative_dirname, level, id, groups } = this.state.currentRuleInfo;
    const compliance = this.buildCompliance(this.state.currentRuleInfo);

    return (
      <>
        <EuiFlyoutHeader hasBorder className="flyout-header">
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <span style={{ fontSize: '22px' }}>
                  {
                    description && (
                      <span
                        dangerouslySetInnerHTML={{ __html: this.updateStyleTitle(description) }}
                      />)
                  }
                </span>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="popout"
                aria-label="popout"
                href={`#/overview?tab=general&tabView=panels&addRuleFilter=${id}`}
                target="blank"
              >
                View alerts of this Rule
                </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiFlyoutBody className="flyout-body">
          <EuiFlexGroup>
            <EuiFlexItem>
              {/* Cards */}
              <EuiFlexGroup>
                {/* General info */}
                <EuiFlexItem style={{ marginBottom: 16, marginTop: 8 }}>
                  <EuiAccordion
                    id="Info"
                    buttonContent={
                      <EuiTitle size="s">
                        <h3>Information</h3>
                      </EuiTitle>
                    }
                    paddingSize="none"
                    initialIsOpen={true}
                    isLoading={this.state.isLoading}
                    isLoadingMessage={''}
                  >
                    <EuiFlexItem className="flyout-row details-row">
                      {this.renderInfo(id, level, filename, relative_dirname, groups)}
                    </EuiFlexItem>
                  </EuiAccordion>
                </EuiFlexItem>
              </EuiFlexGroup>
              {/* Details */}
              <EuiFlexGroup>
                <EuiFlexItem style={{ marginTop: 8 }}>
                  <EuiAccordion
                    id="Details"
                    buttonContent={
                      <EuiTitle size="s">
                        <h3>Details</h3>
                      </EuiTitle>
                    }
                    paddingSize="none"
                    initialIsOpen={true}
                    isLoading={this.state.isLoading}
                    isLoadingMessage={''}
                  >
                    <EuiFlexItem className="flyout-row details-row">{this.renderDetails(details)}</EuiFlexItem>
                  </EuiAccordion>
                </EuiFlexItem>
              </EuiFlexGroup>
              {/* Compliance */}
              {compliance && Object.keys(compliance).length > 0 && (
                <EuiFlexGroup>
                  <EuiFlexItem style={{ marginTop: 8 }}>
                    <EuiAccordion
                      id="Compliance"
                      buttonContent={
                        <EuiTitle size="s">
                          <h3>Compliance</h3>
                        </EuiTitle>
                      }
                      paddingSize="none"
                      initialIsOpen={true}
                      isLoading={this.state.isLoading}
                      isLoadingMessage={''}
                    >
                      <EuiFlexItem className="flyout-row details-row">
                        {this.renderCompliance(compliance)}
                      </EuiFlexItem>
                    </EuiAccordion>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
              {/* Table */}
              <EuiFlexGroup>
                <EuiFlexItem style={{ marginTop: 8 }}>
                  <EuiAccordion
                    id="Related"
                    buttonContent={
                      <EuiTitle size="s">
                        <h3>Related rules</h3>
                      </EuiTitle>
                    }
                    isLoading={this.state.isLoading}
                    isLoadingMessage={''}
                    paddingSize="none"
                    initialIsOpen={true}
                  >
                    <EuiFlexItem className="flyout-row related-rules-row">
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          {this.state.currentRuleInfo?.filename &&
                            <TableWzAPI
                              tableColumns={this.columns}
                              tableInitialSortingField={'id'}
                              endpoint={`/rules?filename=${this.state.currentRuleInfo.filename}`}
                              tableProps={{ rowProps: this.onClickRow, loading: this.state.isLoading }}
                              tablePageSizeOptions={[10, 25]}
                            />
                          }
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  </EuiAccordion>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutBody>
      </>
    );
  }
}
