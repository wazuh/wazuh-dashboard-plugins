import { createBarList } from '../common';

export const MitreTopTactics = createBarList({
  emptyMessage: 'No MITRE ATT&CK tactics observed in the last 24 hours',
  'data-test-subj': 'mitre-top-tactics',
});
