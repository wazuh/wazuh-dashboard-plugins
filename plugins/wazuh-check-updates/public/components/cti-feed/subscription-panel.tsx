import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIcon,
  EuiLoadingContent,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { statusCodes } from '../../../common/constants';
import { ctiFlowState } from '../../services/cti-flow-state';
import { ISubscriptionResponse } from '../../services/types';

type SubscriptionState = 'registered' | 'pending' | 'failed' | 'notRegistered';

type Tone = 'success' | 'warning' | 'danger' | 'primary';

interface SubscriptionView {
  tone: Tone;
  iconType: string;
  title: string;
  status: string;
  description: string;
  action: string;
  fillAction: boolean;
}

export function getSubscriptionState(
  statusCTI: ISubscriptionResponse,
  deviceFlowActive: boolean,
): SubscriptionState {
  if (statusCTI.status === statusCodes.SUCCESS) {
    return 'registered';
  }
  if (statusCTI.status === statusCodes.REGISTRATION_FAILED) {
    return 'failed';
  }
  return deviceFlowActive ? 'pending' : 'notRegistered';
}

const OPEN_FEED_TITLE = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.subscription.openFeedTitle',
  { defaultMessage: 'Open feed' },
);

function getSubscriptionView(
  state: SubscriptionState,
  planName: string | undefined,
): SubscriptionView {
  switch (state) {
    case 'registered':
      return {
        tone: 'success',
        iconType: 'checkInCircleFilled',
        title:
          planName ||
          i18n.translate(
            'wazuhCheckUpdates.ctiFeed.subscription.registeredTitle',
            { defaultMessage: 'Wazuh CTI subscription' },
          ),
        status: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.registeredStatus',
          { defaultMessage: 'Registered' },
        ),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.registeredDescription',
          {
            defaultMessage:
              'This environment is registered with Wazuh Cyber Threat Intelligence. Manage the subscription and upgrade the plan from the Wazuh Console.',
          },
        ),
        action: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.registeredAction',
          { defaultMessage: 'View registration' },
        ),
        fillAction: false,
      };
    case 'pending':
      return {
        tone: 'warning',
        iconType: 'clock',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.pendingTitle',
          { defaultMessage: 'Activation pending' },
        ),
        status: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.pendingStatus',
          { defaultMessage: 'Waiting for activation' },
        ),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.pendingDescription',
          {
            defaultMessage:
              'Finish the activation in the Wazuh Console with your user code. This page updates once it completes.',
          },
        ),
        action: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.pendingAction',
          { defaultMessage: 'View activation details' },
        ),
        fillAction: true,
      };
    case 'failed':
      return {
        tone: 'danger',
        iconType: 'alert',
        title: OPEN_FEED_TITLE,
        status: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.failedStatus',
          { defaultMessage: 'Registration failed' },
        ),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.failedDescription',
          {
            defaultMessage:
              'The registration could not be completed. This environment keeps receiving the Open feed.',
          },
        ),
        action: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.failedAction',
          { defaultMessage: 'View details' },
        ),
        fillAction: true,
      };
    default:
      return {
        tone: 'primary',
        iconType: 'globe',
        title: OPEN_FEED_TITLE,
        status: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.notRegisteredStatus',
          { defaultMessage: 'Not registered' },
        ),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.notRegisteredDescription',
          {
            defaultMessage:
              'This environment receives the Open feed. Register it with Wazuh Cyber Threat Intelligence to manage it from the Wazuh Console and upgrade to the Professional feed.',
          },
        ),
        action: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.notRegisteredAction',
          { defaultMessage: 'Register' },
        ),
        fillAction: true,
      };
  }
}

const HEALTH_COLOR: Record<Tone, string> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  primary: 'subdued',
};

const FeedTier: React.FC<{
  iconType: string;
  iconColor: string;
  title: string;
  description: string;
}> = ({ iconType, iconColor, title, description }) => (
  <EuiFlexGroup gutterSize='s' responsive={false} alignItems='flexStart'>
    <EuiFlexItem grow={false}>
      <EuiIcon type={iconType} color={iconColor} aria-hidden />
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiText size='s'>
        <strong>{title}</strong>
      </EuiText>
      <EuiText size='xs' color='subdued'>
        {description}
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

/** Open versus Professional, so the paid tier is visible before registering. */
const FeedTiers: React.FC = () => (
  <EuiFlexGroup
    direction='column'
    gutterSize='s'
    data-test-subj='ctiFeedSubscriptionTiers'
  >
    <EuiFlexItem>
      <FeedTier
        iconType='check'
        iconColor='success'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.tiers.openTitle',
          { defaultMessage: 'Open feed (included)' },
        )}
        description={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.tiers.openDescription',
          {
            defaultMessage:
              'Public rules, IOCs and vulnerabilities for every installation.',
          },
        )}
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <FeedTier
        iconType='starFilled'
        iconColor='warning'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.tiers.proTitle',
          { defaultMessage: 'Professional feed' },
        )}
        description={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.tiers.proDescription',
          {
            defaultMessage:
              'Vulnerabilities, IOCs and rules delivered with no delay.',
          },
        )}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export interface SubscriptionPanelProps {
  statusCTI: ISubscriptionResponse;
  loading: boolean;
  deviceFlowActive: boolean;
  onOpenRegistration: () => void;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  statusCTI,
  loading,
  deviceFlowActive,
  onOpenRegistration,
}) => {
  const state = getSubscriptionState(statusCTI, deviceFlowActive);
  const view = getSubscriptionView(
    state,
    ctiFlowState.getSubscription()?.message?.plan?.name,
  );

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      className='ctiFeed__panel'
      data-test-subj='ctiFeedSubscriptionPanel'
    >
      <EuiTitle size='xs'>
        <h2>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.subscription.title', {
            defaultMessage: 'Subscription',
          })}
        </h2>
      </EuiTitle>
      <EuiSpacer size='m' />
      {loading ? (
        <EuiLoadingContent
          lines={4}
          data-test-subj='ctiFeedSubscriptionLoading'
        />
      ) : (
        <>
          <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
            <EuiFlexItem grow={false}>
              <span
                className={`ctiFeed__badgeIcon ctiFeed__badgeIcon--${view.tone}`}
              >
                <EuiIcon type={view.iconType} size='l' aria-hidden />
              </span>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size='s'>
                <h3 data-test-subj='ctiFeedSubscriptionTitle'>{view.title}</h3>
              </EuiTitle>
              <EuiHealth
                color={HEALTH_COLOR[view.tone]}
                data-test-subj='ctiFeedSubscriptionStatus'
              >
                {view.status}
              </EuiHealth>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='m' />
          <EuiText size='s' color='subdued'>
            <p>{view.description}</p>
          </EuiText>
          {state === 'notRegistered' ? (
            <>
              <EuiSpacer size='m' />
              <FeedTiers />
            </>
          ) : null}
          <EuiSpacer size='l' />
          <EuiButton
            fill={view.fillAction}
            onClick={onOpenRegistration}
            iconType={state === 'notRegistered' ? 'globe' : undefined}
            data-test-subj='ctiFeedSubscriptionAction'
          >
            {view.action}
          </EuiButton>
        </>
      )}
    </EuiPanel>
  );
};
