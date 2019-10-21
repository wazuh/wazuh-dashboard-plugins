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
  EuiSpacer
} from '@elastic/eui';

import { connect } from 'react-redux';

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

  renderInfo(id, level, file, path) {
    return (
      <ul>
        <li key="id"><b>ID:</b>&nbsp;{id}</li>
        <EuiSpacer size="s" />
        <li key="level"><b>Level:</b>&nbsp;{level}</li>
        <EuiSpacer size="s" />
        <li key="file"><b>File:</b>&nbsp;{file}</li>
        <EuiSpacer size="s" />
        <li key="path"><b>Path:</b>&nbsp;{path}</li>
        <EuiSpacer size="s" />
      </ul>
    )
  }

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

  renderGroups(groups) {
    const listGroups = [];
    groups.forEach(group => {
      listGroups.push(
        <Fragment>
          <li key={`id-${group}`}>{group}</li>
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

  renderCompliance(compliance) {
    const listCompliance = [];
    const keys = Object.keys(compliance);
    for (let i in Object.keys(keys)) {
      const key = keys[i];
      listCompliance.push(
        <Fragment>
          <li key={`id-${key}`}><b>{key}</b></li>
          <EuiSpacer size="s" />
        </Fragment>
      )
      compliance[key].forEach(element => {
        listCompliance.push(
          <Fragment>
            <li key={`id-${element}`}>{element}</li>
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

  render() {
    const { section, ruleInfo } = this.props.state;
    const currentRuleId = ruleInfo.current;
    const rules = ruleInfo.items;
    const currentRuleArr = rules.filter(r => { return r.id === currentRuleId });
    const currentRuleInfo = currentRuleArr[0];
    const { description, details, file, path, level, id, groups } = currentRuleInfo;
    const compliance = this.buildCompliance(currentRuleInfo);


    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          {/* Rule description name */}
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>
                  <EuiToolTip position="right" content="Back to rules">
                    <EuiButtonIcon aria-label="Back" color="subdued" iconSize="l" iconType="arrowLeft" onClick={() => console.log('GO BACK')} />
                  </EuiToolTip>
                  {description}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>

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
            <EuiFlexItem>
              <EuiPanel paddingSize="s">
                <EuiText color="subdued">Compliance</EuiText>
                <EuiSpacer size="xs" className="subdued-background" />
                <EuiSpacer size="s" />
                {this.renderCompliance(compliance)}
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>


          {/* Table */}
          <EuiFlexGroup>
            <EuiFlexItem>
              {/* <WzRulesetTable wzReq={(method, path, options) => this.props.wzReq(method, path, options)} /> */}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

export default connect(mapStateToProps)(WzRulesetInfo);
