import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

/** What each feed brings, shared by the plan cards and the feed tiers list. */
export const OPEN_FEED_DESCRIPTION = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.subscription.tiers.openDescription',
  {
    defaultMessage:
      'Public rules, IOCs and vulnerabilities for every installation.',
  },
);

export const PROFESSIONAL_FEED_DESCRIPTION = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.subscription.tiers.proDescription',
  {
    defaultMessage: 'New vulnerabilities, IOCs and rules, delivered faster.',
  },
);

export type FeedPlan = 'open' | 'professional';

const YOUR_PLAN = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.subscription.plans.yourPlan',
  { defaultMessage: 'Your plan' },
);

interface PlanCardProps {
  plan: FeedPlan;
  title: string;
  description: string;
  current: boolean;
  /** Badge of a plan that is not the current one, if any. */
  idleBadge?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  title,
  description,
  current,
  idleBadge,
}) => (
  <EuiPanel
    hasBorder
    hasShadow={false}
    paddingSize='m'
    color={current ? 'primary' : 'plain'}
    className={`ctiFeed__planCard${
      current ? ' ctiFeed__planCard--current' : ''
    }`}
    data-test-subj={`ctiFeedPlanCard-${plan}`}
    data-current={current}
  >
    <EuiFlexGroup
      gutterSize='s'
      alignItems='center'
      justifyContent='spaceBetween'
      responsive={false}
      wrap
    >
      <EuiFlexItem grow={false}>
        <EuiTitle size='xs'>
          <h4>{title}</h4>
        </EuiTitle>
      </EuiFlexItem>
      {current ? (
        <EuiFlexItem grow={false}>
          <EuiBadge
            color='primary'
            iconType='checkInCircleFilled'
            data-test-subj='ctiFeedPlanCardCurrent'
          >
            {YOUR_PLAN}
          </EuiBadge>
        </EuiFlexItem>
      ) : idleBadge ? (
        <EuiFlexItem grow={false}>
          <EuiBadge color='hollow'>{idleBadge}</EuiBadge>
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
    <EuiText size='s' color='subdued'>
      <p>{description}</p>
    </EuiText>
  </EuiPanel>
);

export interface PlanCardsProps {
  /** The plan this environment is on; `null` when it is not known. */
  currentPlan: FeedPlan | null;
}

/**
 * The Open and Professional feeds side by side, read only, with the plan this
 * environment is on highlighted.
 */
export const PlanCards: React.FC<PlanCardsProps> = ({ currentPlan }) => (
  <EuiFlexGroup gutterSize='m' wrap data-test-subj='ctiFeedPlanCards'>
    <EuiFlexItem style={{ minWidth: 200 }}>
      <PlanCard
        plan='open'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.plans.openTitle',
          { defaultMessage: 'Open feed' },
        )}
        description={OPEN_FEED_DESCRIPTION}
        current={currentPlan === 'open'}
        idleBadge={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.plans.included',
          { defaultMessage: 'Included' },
        )}
      />
    </EuiFlexItem>
    <EuiFlexItem style={{ minWidth: 200 }}>
      <PlanCard
        plan='professional'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.plans.professionalTitle',
          { defaultMessage: 'Professional feed' },
        )}
        description={PROFESSIONAL_FEED_DESCRIPTION}
        current={currentPlan === 'professional'}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);
