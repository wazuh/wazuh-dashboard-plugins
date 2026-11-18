import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTextColor,
  EuiToolTip,
} from '@elastic/eui';
import type {
  CtiPlanSubscription,
  CtiSubscriptionMessage,
} from '../../../common/cti-registration-status-api';
import {
  formatCtiDate,
  formatCtiTimestamp,
} from '../../services/cti-timestamp';

interface DetailRow {
  title: string;
  description: React.ReactElement | string;
}

/**
 * A value kept on one line: cut with an ellipsis when its column is too narrow, with
 * the full value (or `tooltip`) on hover.
 */
const OneLine: React.FC<{ tooltip: React.ReactNode }> = ({
  tooltip,
  children,
}) => (
  <EuiToolTip
    content={tooltip}
    display='block'
    anchorClassName='ctiFeed__oneLine'
  >
    <span className='ctiFeed__oneLine'>{children}</span>
  </EuiToolTip>
);

/** A calendar date with the exact time in a tooltip; `null` when there is no valid date. */
function renderDate(
  timestamp: string | null | undefined,
  dataTestSubj: string,
) {
  const date = formatCtiDate(timestamp ?? undefined);
  if (!date || !timestamp) {
    return null;
  }
  return (
    <OneLine tooltip={formatCtiTimestamp(timestamp)}>
      <time dateTime={timestamp} data-test-subj={dataTestSubj}>
        {date}
      </time>
    </OneLine>
  );
}

/** The paid subscription behind the current plan, if the CTI console reported one. */
export function getCurrentPlanSubscription(
  message: CtiSubscriptionMessage | null | undefined,
): CtiPlanSubscription | undefined {
  const planName = message?.plan?.name;
  if (!planName) {
    return undefined;
  }
  return message?.environment?.subscriptions?.find(
    subscription => subscription.plan === planName,
  );
}

function getSubscriptionRows(
  subscription: CtiPlanSubscription | undefined,
): DetailRow[] {
  if (!subscription) {
    return [];
  }
  const rows: DetailRow[] = [];
  if (subscription.interval) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.billing',
        { defaultMessage: 'Billing' },
      ),
      description: (() => {
        const billing = i18n.translate(
          'wazuhCheckUpdates.ctiFeed.subscription.details.billingInterval',
          {
            defaultMessage:
              '{interval, select, month {Monthly} year {Yearly} other {{interval}}}',
            values: { interval: subscription.interval },
          },
        );
        return <OneLine tooltip={billing}>{billing}</OneLine>;
      })(),
    });
  }
  const startedAt = renderDate(
    subscription.started_at,
    'ctiFeedSubscriptionStartedAt',
  );
  if (startedAt) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.startedAt',
        { defaultMessage: 'Subscribed since' },
      ),
      description: startedAt,
    });
  }
  const renewsAt = renderDate(
    subscription.renews_at,
    'ctiFeedSubscriptionRenewsAt',
  );
  // A subscription that will not renew shows when it ends instead.
  const expiresAt = renewsAt
    ? null
    : renderDate(subscription.expires_at, 'ctiFeedSubscriptionExpiresAt');
  if (renewsAt) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.renewsAt',
        { defaultMessage: 'Renews' },
      ),
      description: renewsAt,
    });
  } else if (expiresAt) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.expiresAt',
        { defaultMessage: 'Expires' },
      ),
      description: expiresAt,
    });
  }
  // A payment is overdue: the subscription is suspended once this date passes.
  const pastDueEndsAt = renderDate(
    subscription.past_due_ends_at,
    'ctiFeedSubscriptionPastDueEndsAt',
  );
  if (pastDueEndsAt) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.pastDueEndsAt',
        { defaultMessage: 'Payment due by' },
      ),
      description: (
        <EuiTextColor color='warning' component='div'>
          {pastDueEndsAt}
        </EuiTextColor>
      ),
    });
  }
  return rows;
}

export interface SubscriptionDetailsProps {
  message: CtiSubscriptionMessage | null | undefined;
  /** The cluster UUID the device flow sends as `client_id`. */
  environmentUid: string | null;
}

/**
 * How the CTI console knows this environment: its name, organization, ID, and the
 * dates of the subscription that pays for the plan (the registration date is in the
 * card header). A value the console did not report hides its row.
 */
export const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  message,
  environmentUid,
}) => {
  const environment = message?.environment;
  const rows: DetailRow[] = [];

  if (environment?.name) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.environment',
        { defaultMessage: 'Environment' },
      ),
      description: (
        <OneLine tooltip={environment.name}>
          <span data-test-subj='ctiFeedSubscriptionEnvironmentName'>
            {environment.name}
          </span>
        </OneLine>
      ),
    });
  }
  if (environment?.organization?.name) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.organization',
        { defaultMessage: 'Organization' },
      ),
      description: (
        <OneLine tooltip={environment.organization.name}>
          <span data-test-subj='ctiFeedSubscriptionOrganization'>
            {environment.organization.name}
          </span>
        </OneLine>
      ),
    });
  }
  if (environmentUid) {
    const copyLabel = i18n.translate(
      'wazuhCheckUpdates.ctiFeed.subscription.details.copyEnvironmentId',
      { defaultMessage: 'Copy environment ID' },
    );
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.environmentId',
        { defaultMessage: 'Environment ID' },
      ),
      description: (
        <EuiFlexGroup gutterSize='xs' alignItems='center' responsive={false}>
          {/* Shrinks before the copy button does, cut with an ellipsis. */}
          <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
            <OneLine tooltip={environmentUid}>
              <code
                className='ctiFeed__environmentId'
                data-test-subj='ctiFeedSubscriptionEnvironmentId'
              >
                {environmentUid}
              </code>
            </OneLine>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiCopy textToCopy={environmentUid}>
              {copy => (
                <EuiButtonIcon
                  iconType='copyClipboard'
                  onClick={copy}
                  aria-label={copyLabel}
                  title={copyLabel}
                  data-test-subj='ctiFeedSubscriptionCopyEnvironmentId'
                />
              )}
            </EuiCopy>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    });
  }
  rows.push(...getSubscriptionRows(getCurrentPlanSubscription(message)));

  if (rows.length === 0) {
    return null;
  }

  // Two columns of label over value, the value in bold. A `div` around each pair is
  // valid inside a `dl` and keeps every label with its value.
  return (
    <EuiPanel color='subdued' hasShadow={false} paddingSize='m'>
      <dl
        className='ctiFeed__subscriptionDetails'
        data-test-subj='ctiFeedSubscriptionDetails'
      >
        {rows.map(({ title, description }) => (
          <div key={title} className='ctiFeed__subscriptionDetail'>
            <dt className='ctiFeed__subscriptionDetailTitle'>{title}</dt>
            <dd className='ctiFeed__subscriptionDetailValue'>{description}</dd>
          </div>
        ))}
      </dl>
    </EuiPanel>
  );
};
