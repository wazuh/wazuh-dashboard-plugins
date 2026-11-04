import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiBadgeGroup,
  EuiDescriptionList,
  EuiDescriptionListProps,
} from '@elastic/eui';
import type { CatalogIndicator } from '../../../../common/cti-catalog';
import { formatCtiTimestamp } from '../../../services/cti-timestamp';
import {
  getFamilyLabel,
  getIndicatorTypeLabel,
  getProviderLabel,
  getRoleLabel,
} from './catalog-labels';
import { ExternalReference } from './catalog-shared';

const MISSING = '-';

/** `Cobalt Strike (win.cobalt_strike)`, so the stored name stays visible. */
export function formatFamily(name: string | undefined): string {
  if (!name) {
    return MISSING;
  }
  const label = getFamilyLabel(name);
  return label.toLowerCase() === name.toLowerCase()
    ? label
    : `${label} (${name})`;
}

const badges = (values: string[]) =>
  values.length > 0 ? (
    <EuiBadgeGroup gutterSize='xs'>
      {values.map(value => (
        <EuiBadge key={value} color='hollow'>
          {value}
        </EuiBadge>
      ))}
    </EuiBadgeGroup>
  ) : (
    MISSING
  );

/**
 * Every field of an indicator record. `compact` leaves out the fields that
 * matter less on a lookup card (feed record ids, the reference link).
 */
export const IndicatorDetails: React.FC<{
  indicator: CatalogIndicator;
  compact?: boolean;
}> = ({ indicator, compact = false }) => {
  const listItems: EuiDescriptionListProps['listItems'] = [
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.type', {
        defaultMessage: 'Type',
      }),
      description: getIndicatorTypeLabel(indicator.type) || MISSING,
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.provider', {
        defaultMessage: 'Provider',
      }),
      description: getProviderLabel(indicator.provider) || MISSING,
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.feed', {
        defaultMessage: 'Feed',
      }),
      description: indicator.feedName ?? MISSING,
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.indicator.confidence',
        { defaultMessage: 'Confidence' },
      ),
      description:
        indicator.confidence === undefined
          ? MISSING
          : `${indicator.confidence} / 100`,
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.indicator.firstSeen',
        {
          defaultMessage: 'First seen',
        },
      ),
      description: formatCtiTimestamp(indicator.firstSeen),
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.lastSeen', {
        defaultMessage: 'Last seen',
      }),
      description: formatCtiTimestamp(indicator.lastSeen),
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.family', {
        defaultMessage: 'Malware family',
      }),
      description: formatFamily(indicator.software?.name),
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.aliases', {
        defaultMessage: 'Aliases',
      }),
      description: badges(indicator.software?.alias ?? []),
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.role', {
        defaultMessage: 'Role',
      }),
      description: getRoleLabel(indicator.software?.type) || MISSING,
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicator.tags', {
        defaultMessage: 'Tags',
      }),
      description: badges(indicator.tags),
    },
  ];

  if (!compact) {
    listItems.push(
      {
        title: i18n.translate(
          'wazuhCheckUpdates.ctiCatalog.indicator.reference',
          { defaultMessage: 'Reference' },
        ),
        description: indicator.reference ? (
          <ExternalReference url={indicator.reference} />
        ) : (
          MISSING
        ),
      },
      {
        title: i18n.translate(
          'wazuhCheckUpdates.ctiCatalog.indicator.recordId',
          { defaultMessage: 'Catalog record' },
        ),
        description: indicator.externalId ?? indicator.id,
      },
    );
  }

  return (
    <EuiDescriptionList
      type='column'
      compressed
      className='ctiCatalog__details'
      listItems={listItems}
    />
  );
};
