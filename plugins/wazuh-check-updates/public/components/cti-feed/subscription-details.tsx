import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiCopy,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
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
    <EuiToolTip content={formatCtiTimestamp(timestamp)}>
      <time dateTime={timestamp} data-test-subj={dataTestSubj}>
        {date}
      </time>
    </EuiToolTip>
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
  return message?.subscriptions?.find(
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
      description: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.billingInterval',
        {
          defaultMessage:
            '{interval, select, month {Monthly} year {Yearly} other {{interval}}}',
          values: { interval: subscription.interval },
        },
      ),
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
  return rows;
}

export interface SubscriptionDetailsProps {
  message: CtiSubscriptionMessage | null | undefined;
  /** The cluster UUID the device flow sends as `client_id`. */
  environmentUid: string | null;
}

/**
 * How the CTI console knows this environment: its name, organization, ID, and the
 * dates of the registration and of the subscription that pays for the plan. A value
 * the console did not report hides its row.
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
        <span data-test-subj='ctiFeedSubscriptionEnvironmentName'>
          {environment.name}
        </span>
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
        <span data-test-subj='ctiFeedSubscriptionOrganization'>
          {environment.organization.name}
        </span>
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
          <EuiFlexItem grow={false}>
            <code
              className='ctiFeed__environmentId'
              data-test-subj='ctiFeedSubscriptionEnvironmentId'
            >
              {environmentUid}
            </code>
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
  const registeredAt = renderDate(
    environment?.registered_at,
    'ctiFeedSubscriptionRegisteredAt',
  );
  if (registeredAt) {
    rows.push({
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.subscription.details.registeredAt',
        { defaultMessage: 'Registered' },
      ),
      description: registeredAt,
    });
  }
  rows.push(...getSubscriptionRows(getCurrentPlanSubscription(message)));

  if (rows.length === 0) {
    return null;
  }

  return (
    <EuiDescriptionList
      type='responsiveColumn'
      compressed
      className='ctiFeed__subscriptionDetails'
      data-test-subj='ctiFeedSubscriptionDetails'
      listItems={rows}
    />
  );
};
