import React, { Component, Fragment } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiButtonIcon,
  EuiTitle,
  EuiToolTip,
  EuiBadge,
  EuiSpacer,
  EuiInMemoryTable,
  EuiLink
} from '@elastic/eui';

import { connect } from 'react-redux';

import RulesetHandler from './utils/ruleset-handler';

import {
  updateFileContent,
  cleanFileContent,
  cleanInfo,
  updateFilters,
  cleanFilters
} from '../../../../../redux/actions/rulesetActions';

class WzRuleInfo extends Component {
  constructor(props) {
    super(props);
    this.complianceEquivalences = {
      pci: 'PCI DSS',
      gdpr: 'GDPR',
      gpg13: 'GPG 13',
      hipaa: 'HIPAA',
      'nist-800-53': 'NIST-800-53',
      tsc: 'TSC'
    };

    this.rulesetHandler = RulesetHandler;
    this.columns = [
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
        sortable: true,
        width: '10%'
      },
      {
        name: 'Compliance',
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
                onClick={async event => {
                  event.stopPropagation();
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
                  this.props.updateFileContent(file);
                }}
              >
                {value}
              </EuiLink>
            </EuiToolTip>
          );
        }
      }
    ];
  }

  /**
   * Build an object with the compliance info about a rule
   * @param {Object} ruleInfo
   */
  buildCompliance(ruleInfo) {
    const compliance = {};
    const complianceKeys = [
      'gdpr',
      'gpg13',
      'hipaa',
      'nist-800-53',
      'pci',
      'tsc'
    ];
    Object.keys(ruleInfo).forEach(key => {
      if (complianceKeys.includes(key) && ruleInfo[key].length)
        compliance[key] = ruleInfo[key];
    });
    return compliance || {};
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
            onClick={ev => ev.stopPropagation()}
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
    } catch (error) {}

    return <div>{badgeList}</div>;
  }

  /**
   * Clean the existing filters and sets the new ones and back to the previous section
   */
  setNewFiltersAndBack(filters) {
    const fil = filters.filters || filters;
    this.props.cleanFilters();
    this.props.updateFilters(fil);
    this.props.cleanInfo();
  }

  /**
   * Render the basic information in a list
   * @param {Number} id
   * @param {Number} level
   * @param {String} file
   * @param {String} path
   */
  renderInfo(id, level, file, path) {
    return (
      <ul>
        <li key="id">
          <b>ID:</b>&nbsp;{id}
        </li>
        <EuiSpacer size="s" />
        <li key="level">
          <b>Level:</b>
          <EuiToolTip position="top" content={`Filter by this level: ${level}`}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack({ level: level })}
            >
              &nbsp;{level}
            </EuiLink>
          </EuiToolTip>
        </li>

        <EuiSpacer size="s" />
        <li key="file">
          <b>File:</b>
          <EuiToolTip position="top" content={`Filter by this file: ${file}`}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack({ file: file })}
            >
              &nbsp;{file}
            </EuiLink>
          </EuiToolTip>
        </li>
        <EuiSpacer size="s" />
        <li key="path">
          <b>Path:</b>
          <EuiToolTip position="top" content={`Filter by this path: ${path}`}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack({ path: path })}
            >
              &nbsp;{path}
            </EuiLink>
          </EuiToolTip>
        </li>

        <EuiSpacer size="s" />
      </ul>
    );
  }

  /**
   * Render a list with the details
   * @param {Array} details
   */
  renderDetails(details) {
    const detailsToRender = [];
    Object.keys(details).forEach((key, inx) => {
      detailsToRender.push(
        <li key={key}>
          <b>{key}:</b>&nbsp;{details[key] === '' ? 'true' : details[key]}
        </li>
      );
    });
    return <ul style={{ lineHeight: 'initial' }}>{detailsToRender}</ul>;
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
            onClick={async () => this.setNewFiltersAndBack({ group: group })}
          >
            <EuiToolTip
              position="top"
              content={`Filter by this group: ${group}`}
            >
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

  /**
   * Render the compliance(HIPAA, NIST...)
   * @param {Array} compliance
   */
  renderCompliance(compliance) {
    const listCompliance = [];
    const keys = Object.keys(compliance);
    for (let i in Object.keys(keys)) {
      const key = keys[i];

      const values = compliance[key].map((element, index) => {
        const filters = {};
        filters[key] = element;
        return (
          <span key={element}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack({ filters })}
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
        <li key={key}>
          <b>{this.complianceEquivalences[key]}</b>
          <p>{values}</p>
          <EuiSpacer size="s" />
        </li>
      );
    }
    return <ul>{listCompliance}</ul>;
  }

  /**
   * Changes between rules
   * @param {Number} ruleId
   */
  changeBetweenRules(ruleId) {
    this.setState({ currentRuleId: ruleId });
  }

  render() {
    const { ruleInfo, isLoading } = this.props.state;
    const currentRuleId =
      this.state && this.state.currentRuleId
        ? this.state.currentRuleId
        : ruleInfo.current;
    const rules = ruleInfo.items;
    const currentRuleArr = rules.filter(r => {
      return r.id === currentRuleId;
    });
    const currentRuleInfo = currentRuleArr[0];
    const {
      description,
      details,
      file,
      path,
      level,
      id,
      groups
    } = currentRuleInfo;
    const compliance = this.buildCompliance(currentRuleInfo);
    const columns = this.columns;

    const onClickRow = item => {
      return {
        onClick: () => {
          this.changeBetweenRules(item.id);
        }
      };
    };

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiFlexGroup>
          <EuiFlexItem>
            {/* Rule description name */}
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h2>
                    <EuiToolTip position="right" content="Back to rules">
                      <EuiButtonIcon
                        aria-label="Back"
                        color="primary"
                        iconSize="l"
                        iconType="arrowLeft"
                        onClick={() => this.props.cleanInfo()}
                      />
                    </EuiToolTip>
                    {description}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* Cards */}
            <EuiSpacer size="m" />
            <EuiFlexGroup>
              {/* General info */}
              <EuiFlexItem>
                <EuiPanel paddingSize="m">
                  <EuiTitle size={'s'}>
                    <h3>Information</h3>
                  </EuiTitle>
                  <EuiSpacer size="s" />
                  {this.renderInfo(id, level, file, path)}
                  {/* Groups */}
                  <EuiSpacer size={'m'} />
                  <EuiTitle size={'s'}>
                    <h3>Groups</h3>
                  </EuiTitle>
                  <EuiSpacer size="s" />
                  {this.renderGroups(groups)}
                </EuiPanel>
              </EuiFlexItem>
              {/* Details */}
              <EuiFlexItem>
                <EuiPanel paddingSize="m">
                  <EuiTitle size={'s'}>
                    <h3>Details</h3>
                  </EuiTitle>
                  <EuiSpacer size="s" />
                  {this.renderDetails(details)}
                </EuiPanel>
              </EuiFlexItem>
              {/* Compliance */}
              {Object.keys(compliance).length > 0 && (
                <EuiFlexItem>
                  <EuiPanel paddingSize="m">
                    <EuiTitle size={'s'}>
                      <h3>Compliance</h3>
                    </EuiTitle>
                    <EuiSpacer size="s" />
                    {this.renderCompliance(compliance)}
                  </EuiPanel>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
            {/* Table */}
            <EuiSpacer size="l" />
            <EuiPanel paddingSize="m">
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiTitle size="s">
                        <h5>Related rules</h5>
                      </EuiTitle>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer size="m" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiInMemoryTable
                        itemId="id"
                        items={rules}
                        rowProps={onClickRow}
                        columns={columns}
                        pagination={true}
                        loading={isLoading}
                        sorting={true}
                        message={false}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateFileContent: content => dispatch(updateFileContent(content)),
    cleanFileContent: () => dispatch(cleanFileContent()),
    updateFilters: filters => dispatch(updateFilters(filters)),
    cleanFilters: () => dispatch(cleanFilters()),
    cleanInfo: () => dispatch(cleanInfo())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzRuleInfo);
