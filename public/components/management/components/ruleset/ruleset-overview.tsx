import React, { useEffect, useState } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPage,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import { connect } from 'react-redux';
import { updateRulesetSection } from '../../../../redux/actions/rulesetActions';

// Wazuh components
import WzRulesetTable from './ruleset-table';
import WzRulesetSearchBar from './ruleset-search-bar';
import './ruleset-overview.scss';
import { withGlobalBreadcrumb } from '../../../common/hocs/withGlobalBreadcrumb';
import { withUserAuthorizationPrompt } from '../../../common/hocs/withUserAuthorization';
import { compose } from 'redux';
import WzRulesetActionButtons from './actions-buttons';

const WzRulesetOverview = (props) => {
  const sectionNames = {
    rules: 'Rules',
    decoders: 'Decoders',
    lists: 'CDB lists',
  };

  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    props.updateRulesetSection(props.section);
  }, []);

  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle>
              <h2>
                {sectionNames[props.section]}{' '}
                {totalItems === false ? <EuiLoadingSpinner /> : <span>({totalItems})</span>}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem />
          <WzRulesetActionButtons {...props} />
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText color="subdued">{`From here you can manage your ${props.section}.`}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <WzRulesetSearchBar />
        <EuiFlexGroup>
          <EuiFlexItem>
            <WzRulesetTable
              request={props.section}
              updateTotalItems={(totalItems) => setTotalItems(totalItems)}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPage>
  );
};

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers,
  };
};

const SectionResourceType = {
  rules: 'file',
  decoders: 'file',
  lists: 'path',
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateRulesetSection: (section) => dispatch(updateRulesetSection(section)),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withGlobalBreadcrumb((props) => {
    const sectionNames = {
      rules: 'Rules',
      decoders: 'Decoders',
      lists: 'CDB lists',
    };
    return [
      { text: '' },
      { text: 'Management', href: '/app/wazuh#/manager' },
      { text: sectionNames[props.state.section] },
    ];
  }),
  withUserAuthorizationPrompt((props) => [
    {
      action: `${props.state.section}:read`,
      resource: `${props.state.section.slice(0, -1)}:${SectionResourceType[props.state.section]}:*`,
    },
  ])
)(WzRulesetOverview);
