import React from 'react';
import { BarList } from './bar-list';
import { TopItem } from '../services/types';

export interface MitreTopTacticsProps {
  items: TopItem[];
  getHref?: (item: TopItem) => string | undefined;
  onSelect?: (item: TopItem) => void;
}

/** Top MITRE ATT&CK tactics as a clickable ranked bar list. */
export const MitreTopTactics: React.FC<MitreTopTacticsProps> = ({
  items,
  getHref,
  onSelect,
}) => (
  <BarList
    items={items}
    getHref={getHref}
    onSelect={onSelect}
    emptyMessage='No MITRE ATT&CK tactics observed in the last 24 hours'
    data-test-subj='mitre-top-tactics'
  />
);
