import React from 'react';
import { euiPaletteColorBlind } from '@elastic/eui';
import {
  DistributionBar,
  DistributionBarSegment,
  WidgetGroupBody,
} from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import { TopItem } from '../../interfaces/types';
import { formatUINumber } from '../../../../../../react-services/format-number';

export interface ThreatTypeCompositionProps {
  /** Top threat types in the catalog (`document.software.type`), by indicator count. */
  byThreatType: DataGroupResult<TopItem[]>;
}

/** Short tokens in these terms are acronyms (`cc`, `c2`, `apt`). */
const ACRONYM_MAX_LENGTH = 3;

function threatTypeLabel(key: string): string {
  const words = key
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word =>
      word.length <= ACRONYM_MAX_LENGTH ? word.toUpperCase() : word,
    );
  if (words.length === 0) {
    return key;
  }
  const [first, ...rest] = words;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ');
}

/** Threat types carry no severity, so they take the categorical palette. */
const PALETTE = euiPaletteColorBlind();

export const ThreatTypeComposition: React.FC<ThreatTypeCompositionProps> = ({
  byThreatType,
}) => {
  const items = byThreatType.data ?? [];
  const segments: DistributionBarSegment[] = items.map((item, index) => ({
    key: item.key,
    label: threatTypeLabel(item.key),
    count: item.count,
    color: PALETTE[index % PALETTE.length],
    // The raw term, so the indexed value stays recoverable from the UI.
    tooltip: `${item.key}: ${formatUINumber(item.count)}`,
  }));

  return (
    <WidgetGroupBody
      status={byThreatType.status}
      errorLabel={byThreatType.error?.message}
      showManageIndexPatternsLink={
        byThreatType.error?.kind === 'index-pattern-missing'
      }
      isPermissionDenied={byThreatType.error?.kind === 'permission-denied'}
    >
      <DistributionBar
        segments={segments}
        headline={segments.length > 0 ? 'Top IOCs by threat type' : undefined}
        emptyMessage='No threat types in the catalog'
        data-test-subj='threat-catalog-threat-types'
      />
    </WidgetGroupBody>
  );
};
