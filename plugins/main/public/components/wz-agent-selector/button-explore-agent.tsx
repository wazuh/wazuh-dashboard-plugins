import React from 'react';
import { isVersionLower } from '../endpoints-summary/table/utils';
import { WzButton, IconTip } from '../common/buttons';
import { PinnedAgentManager } from './wz-agent-selector-service';
import { WzButtonType } from '../common/buttons/button';
import { connect } from 'react-redux';
import { showExploreAgentModalGlobal } from '../../redux/actions/appStateActions';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import './button-explore-agent.scss';
import { getAgentVersion } from '../../../common/services/wz-agent';

import clsx from 'clsx';
import { i18n } from '@osd/i18n';

interface ButtonPinnedAgentProps {
  showExploreAgentModalGlobal: (shouldShow: boolean) => void;
  module?: {
    availableFor?: string[];
  };
  onUnpinAgent?: () => void;
}

const ButtonPinnedAgent = ({
  showExploreAgentModalGlobal,
  module,
  onUnpinAgent,
}: ButtonPinnedAgentProps) => {
  const pinnedAgentManager = new PinnedAgentManager();
  const agent = pinnedAgentManager.isPinnedAgent()
    ? pinnedAgentManager.getPinnedAgent()
    : null;
  const avaliableForAgent = module
    ? module?.availableFor && module?.availableFor.includes('agent')
    : true;
  const outdatedAgentPinned = agent?.version
    ? isVersionLower(getAgentVersion(agent.version).raw, '5.0.0')
    : false;

  const unPinAgentHandler = () => {
    pinnedAgentManager.unPinAgent();
    onUnpinAgent?.();
  };

  return (
    <EuiFlexGroup
      data-test-subj='explore-agent-button'
      gutterSize='none'
      alignItems='center'
      responsive={false}
    >
      <EuiFlexItem grow={false} style={{ paddingLeft: 5, paddingRight: 5 }}>
        <IconTip
          iconType='alert'
          color='warning'
          size='l'
          isDisabled={!outdatedAgentPinned}
          message={i18n.translate('wz-explore-agent.outdatedVersion', {
            defaultMessage:
              'Agent version is below 5.0.0. Some features may not be available.',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <WzButton
          buttonType={WzButtonType.empty}
          color='primary'
          isDisabled={!avaliableForAgent}
          tooltip={{
            position: 'bottom',
            content: !avaliableForAgent
              ? i18n.translate('wz-explore-agent.moduleNotSupported', {
                  defaultMessage: 'This module is not supported for agents.',
                })
              : agent
              ? i18n.translate('wz-explore-agent.changeSelected', {
                  defaultMessage: 'Change agent selected',
                })
              : i18n.translate('wz-explore-agent.selectAgent', {
                  defaultMessage: 'Select an agent to explore its modules',
                }),
          }}
          className={clsx({ 'wz-unpin-agent-bg': agent })}
          iconType='watchesApp'
          onClick={() => showExploreAgentModalGlobal(true)}
        >
          {agent
            ? `${agent.name} (${agent.id})`
            : i18n.translate('wz-explore-agent.buttonLabel', {
                defaultMessage: 'Explore agent',
              })}
        </WzButton>
      </EuiFlexItem>
      {agent ? (
        <EuiFlexItem grow={false}>
          <WzButton
            buttonType={WzButtonType.icon}
            className='wz-unpin-agent wz-unpin-agent-bg'
            iconType='pinFilled'
            onClick={unPinAgentHandler}
            tooltip={{
              position: 'bottom',
              content: i18n.translate('wz-explore-agent.unpin', {
                defaultMessage: 'Unpin agent',
              }),
            }}
            aria-label={i18n.translate('wz-explore-agent.unpin', {
              defaultMessage: 'Unpin agent',
            })}
          />
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
  );
};

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

const mapDispatchToProps = dispatch => ({
  showExploreAgentModalGlobal: (shouldShow: boolean) =>
    dispatch(showExploreAgentModalGlobal(shouldShow)),
});

export const ButtonExploreAgent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ButtonPinnedAgent);
