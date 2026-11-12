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
import { statusCodes, WAZUH_CTI_CONSOLE_HREF } from '../../../common/constants';
import type { CtiSubscriptionPlan } from '../../../common/cti-registration-status-api';
import { ctiFlowState } from '../../services/cti-flow-state';
import { ISubscriptionResponse } from '../../services/types';
import { useCtiRegistrationPermission } from '../../shared-components/cti-registration/hooks/use-cti-registration-permission';
import { SubscriptionDetails } from './subscription-details';
import { RegistrationOptions } from './registration-options';

type SubscriptionState = 'registered' | 'pending' | 'failed' | 'notRegistered';

type Tone = 'success' | 'warning' | 'danger' | 'primary';

interface SubscriptionView {
  tone: Tone;
  iconType: string;
  title: string;
  status: string;
  description: string;
  /** Opens the registration flow; a registered environment has none. */
  action?: string;
  fillAction: boolean;
  /** Open versus Professional, for environments that do not have the latter. */
  showFeedTiers: boolean;
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
  plan: CtiSubscriptionPlan | undefined,
): SubscriptionView {
  switch (state) {
    case 'registered':
      return {
        tone: 'success',
        iconType: 'checkInCircleFilled',
        title: plan?.name
          ? i18n.translate(
              'wazuhCheckUpdates.ctiFeed.subscription.registeredPlanTitle',
              {
                defaultMessage: '{planName} feed',
                values: { planName: plan.name },
              },
            )
          : i18n.translate(
              'wazuhCheckUpdates.ctiFeed.subscription.registeredTitle',
              { defaultMessage: 'Wazuh CTI subscription' },
            ),
        status: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.registeredStatus',
          { defaultMessage: 'Registered' },
        ),
        // A public plan is the Open feed: suggest upgrading to the Professional one.
        description: plan?.is_public
          ? i18n.translate(
              'wazuhCheckUpdates.ctiFeed.subscription.registeredOpenDescription',
              {
                defaultMessage:
                  'This environment is registered with Wazuh Cyber Threat Intelligence and receives the Open feed. Upgrade it to the Professional feed from the Wazuh Console to get vulnerabilities, IOCs and rules with no delay.',
              },
            )
          : plan?.name
          ? i18n.translate(
              'wazuhCheckUpdates.ctiFeed.subscription.registeredDescription',
              {
                defaultMessage: 'This environment is on the {planName} feed.',
                values: { planName: plan.name },
              },
            )
          : i18n.translate(
              'wazuhCheckUpdates.ctiFeed.subscription.registeredNoPlanDescription',
              {
                defaultMessage:
                  'This environment is registered with Wazuh Cyber Threat Intelligence.',
              },
            ),
        fillAction: false,
        showFeedTiers: Boolean(plan?.is_public),
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
        showFeedTiers: false,
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
        showFeedTiers: false,
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
        showFeedTiers: true,
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

/** Open versus Professional, so the paid tier is visible to those without it. */
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
            defaultMessage: 'Vulnerabilities, IOCs and rules delivered faster.',
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
  /** Called once the local registration was cleared, to refresh the page. */
  onRegistrationCleared: () => void;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  statusCTI,
  loading,
  deviceFlowActive,
  onOpenRegistration,
  onRegistrationCleared,
}) => {
  const state = getSubscriptionState(statusCTI, deviceFlowActive);
  const subscriptionMessage = ctiFlowState.getSubscription()?.message;
  const view = getSubscriptionView(state, subscriptionMessage?.plan);
  const registered = state === 'registered';
  // Only a registration the indexer holds can be cleared.
  const clearable = registered && Boolean(subscriptionMessage?.is_registered);
  const clearPermission = useCtiRegistrationPermission(clearable, 'clear');
  const showOptions =
    clearable && !clearPermission.loading && clearPermission.accessAllowed;

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      className='ctiFeed__panel'
      data-test-subj='ctiFeedSubscriptionPanel'
    >
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='center'
        gutterSize='s'
        responsive={false}
      >
        <EuiFlexItem>
          <EuiTitle size='xs'>
            <h2>
              {i18n.translate('wazuhCheckUpdates.ctiFeed.subscription.title', {
                defaultMessage: 'Subscription',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        {showOptions && !loading ? (
          <EuiFlexItem grow={false}>
            <RegistrationOptions onCleared={onRegistrationCleared} />
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
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
          {registered ? (
            <>
              <EuiSpacer size='m' />
              <SubscriptionDetails
                message={subscriptionMessage}
                environmentUid={ctiFlowState.getEnvironmentUid()}
              />
            </>
          ) : null}
          {view.showFeedTiers ? (
            <>
              <EuiSpacer size='m' />
              <FeedTiers />
            </>
          ) : null}
          {registered ? (
            <>
              <EuiSpacer size='l' />
              <EuiButton
                fill
                href={WAZUH_CTI_CONSOLE_HREF}
                target='_blank'
                rel='noopener noreferrer'
                iconType='popout'
                iconSide='right'
                data-test-subj='ctiFeedSubscriptionConsoleLink'
              >
                {i18n.translate(
                  'wazuhCheckUpdates.ctiFeed.subscription.openConsole',
                  { defaultMessage: 'Open in Wazuh Console' },
                )}
              </EuiButton>
            </>
          ) : null}
          {view.action ? (
            <>
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
          ) : null}
        </>
      )}
    </EuiPanel>
  );
};
