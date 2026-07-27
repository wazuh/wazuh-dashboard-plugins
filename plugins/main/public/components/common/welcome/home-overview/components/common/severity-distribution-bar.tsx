import React from 'react';
import { DistributionBar, DistributionBarSegment } from './distribution-bar';
import { SeverityBand, SeverityCounts } from '../../interfaces/types';
import { SEVERITY_PRESENTATION } from '../../lib/severity-presentation';

export interface SeverityDistributionBarProps {
  counts: SeverityCounts;
  /** Sentence above the bar, e.g. "1,213 open vulnerabilities". */
  headline?: React.ReactNode;
  /** When set, each legend count becomes a link that drills into that band. */
  onSelect?: (band: SeverityBand) => string | undefined;
  emptyMessage?: React.ReactNode;
  /** Distinct data-test-subjs when two distribution bars share a page. */
  testSubjPrefix?: string;
}

/** Findings/vulnerabilities severity counts as a single proportional bar + legend. */
export const SeverityDistributionBar: React.FC<
  SeverityDistributionBarProps
> = ({
  counts,
  headline,
  onSelect,
  emptyMessage = 'No data available',
  testSubjPrefix = 'severity-distribution',
}) => {
  const segments: DistributionBarSegment[] = SEVERITY_PRESENTATION.filter(
    presentation => presentation.band in counts,
  ).map(presentation => ({
    key: presentation.band,
    label: presentation.label,
    count: counts[presentation.band] ?? 0,
    color: presentation.color,
    href: onSelect ? onSelect(presentation.band) : undefined,
  }));

  return (
    <DistributionBar
      segments={segments}
      headline={headline}
      emptyMessage={emptyMessage}
      data-test-subj={testSubjPrefix}
    />
  );
};
