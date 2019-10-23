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
  EuiText,
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
} from '../../../../redux/actions/rulesetActions';

class WzRulesetInfo extends Component {
  constructor(props) {
    super(props);
    this.complianceEquivalences = {
      pci: 'PCI DSS',
      gdpr: 'GDPR',
      gpg13: 'GPG 13',
      hipaa: 'HIPAA',
      'nist-800-53': 'NIST-800-53'
    }

    this.rulesetHandler = RulesetHandler;
    this.columns = [
      {
        name: 'ID',
        align: 'left',
        sortable: true,
        width: '5%',
        render: item => {
          return (
            <EuiToolTip position="top" content={`Show rule ID ${item.id} information`}>
              <EuiLink onClick={async () => {
                this.changeBetweenRules(item.id);
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
                this.props.updateFileContent(result);
              }
              }>
                {item}
              </EuiLink>
            </EuiToolTip>
          )
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
    const complianceKeys = ['gdpr', 'gpg13', 'hipaa', 'nist-800-53', 'pci'];
    Object.keys(ruleInfo).forEach(key => {
      if (complianceKeys.includes(key) && ruleInfo[key].length) compliance[key] = ruleInfo[key]
    });
    return compliance || {};
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
        <li key="id"><b>ID:</b>&nbsp;{id}</li>
        <EuiSpacer size="s" />
        <li key="level"><b>Level:</b>
          <EuiLink onClick={async () => this.setNewFiltersAndBack({ level: level })}>
            &nbsp;{level}
          </EuiLink>
        </li>

        <EuiSpacer size="s" />
        <li key="file"><b>File:</b>
          <EuiLink onClick={async () => this.setNewFiltersAndBack({ file: file })}>
            &nbsp;{file}
          </EuiLink>
        </li>
        <EuiSpacer size="s" />
        <li key="path"><b>Path:</b>
          <EuiLink onClick={async () => this.setNewFiltersAndBack({ path: path })}>
            &nbsp;{path}
          </EuiLink>
        </li>

        <EuiSpacer size="s" />
      </ul>
    )
  }

  /**
   * Render a list with the details
   * @param {Array} details 
   */
  renderDetails(details) {
    const detailsToRender = [];
    Object.keys(details).forEach(key => {
      detailsToRender.push(
        <Fragment>
          <li key={`id-${key}`}><b>{key}:</b>&nbsp;{details[key]}</li>
          <EuiSpacer size="s" />
        </Fragment>
      );
    });
    return (
      <ul>
        {detailsToRender}
      </ul>
    )
  }

  /**
   * Render the groups
   * @param {Array} groups 
   */
  renderGroups(groups) {
    const listGroups = [];
    groups.forEach(group => {
      listGroups.push(
        <Fragment>
          <EuiLink onClick={async () => this.setNewFiltersAndBack({ group: group })}>
            <li key={`id-${group}`}>{group}</li>
          </EuiLink>
          <EuiSpacer size="s" />
        </Fragment>
      );
    });
    return (
      <ul>
        {listGroups}
      </ul>
    )
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
      listCompliance.push(
        <Fragment>
          <li key={`id-${key}`}><b>{this.complianceEquivalences[key]}</b></li>
          <EuiSpacer size="s" />
        </Fragment>
      )
      compliance[key].forEach(element => {
        const filters = {};
        filters[key] = element;
        listCompliance.push(
          <Fragment>
            <EuiLink onClick={async () => this.setNewFiltersAndBack({ filters })}>
              <li key={`id-${element}`}>{element}</li>
            </EuiLink>
            <EuiSpacer size="s" />
          </Fragment>
        );
      });
    }
    return (
      <ul>
        {listCompliance}
      </ul>
    )
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
    const currentRuleId = (this.state && this.state.currentRuleId) ? this.state.currentRuleId : ruleInfo.current;
    const rules = ruleInfo.items;
    const currentRuleArr = rules.filter(r => { return r.id === currentRuleId });
    const currentRuleInfo = currentRuleArr[0];
    const { description, details, file, path, level, id, groups } = currentRuleInfo;
    const compliance = this.buildCompliance(currentRuleInfo);
    const columns = this.columns;


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
                        color="subdued"
                        iconSize="l"
                        iconType="arrowLeft"
                        onClick={() => this.props.cleanInfo()} />
                    </EuiToolTip>
                    {description}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            {/* Cards */}
            <EuiFlexGroup>
              {/* General info */}
              <EuiFlexItem>
                <EuiPanel paddingSize="s">
                  <EuiText color="subdued">Information</EuiText>
                  <EuiSpacer size="xs" className="subdued-background" />
                  <EuiSpacer size="s" />
                  {this.renderInfo(id, level, file, path)}
                </EuiPanel>
              </EuiFlexItem>
              {/* Details */}
              <EuiFlexItem>
                <EuiPanel paddingSize="s">
                  <EuiText color="subdued">Details</EuiText>
                  <EuiSpacer size="xs" className="subdued-background" />
                  <EuiSpacer size="s" />
                  {this.renderDetails(details)}
                </EuiPanel>
              </EuiFlexItem>
              {/* Groups */}
              <EuiFlexItem>
                <EuiPanel paddingSize="s">
                  <EuiText color="subdued">Groups</EuiText>
                  <EuiSpacer size="xs" className="subdued-background" />
                  <EuiSpacer size="s" />
                  {this.renderGroups(groups)}
                </EuiPanel>
              </EuiFlexItem>
              {/* Compliance */}
              {Object.keys(compliance).length > 0 && (
                <EuiFlexItem>
                  <EuiPanel paddingSize="s">
                    <EuiText color="subdued">Compliance</EuiText>
                    <EuiSpacer size="xs" className="subdued-background" />
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
                        <h5>
                          Related rules
                      </h5>
                      </EuiTitle>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer size="m" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiInMemoryTable
                        itemId="id"
                        items={rules}
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

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateFileContent: content => dispatch(updateFileContent(content)),
    cleanFileContent: () => dispatch(cleanFileContent()),
    updateFilters: filters => dispatch(updateFilters(filters)),
    cleanFilters: () => dispatch(cleanFilters()),
    cleanInfo: () => dispatch(cleanInfo())
  }
};


export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetInfo);
