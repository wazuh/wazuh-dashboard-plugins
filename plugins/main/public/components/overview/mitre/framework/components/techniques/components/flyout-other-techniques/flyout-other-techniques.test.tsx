// The buckets use the indexer names (doc_count)
/* eslint-disable camelcase */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DATA_SOURCE_FILTER_CONTROLLED_MITRE_OTHER_TECHNIQUE_VALUE } from '../../../../../../../../../common/constants';
import { FlyoutOtherTechniques } from './flyout-other-techniques';

const mockSetFilters = jest.fn();
const mockCreateFilter = jest.fn((...args: unknown[]) => ({
  meta: { controlledBy: args[4] },
  values: args[2],
}));
let mockStoredFilters: unknown[] = [];

jest.mock('../../../../../../../../kibana-services');
jest.mock('../../../../../../../../../../../src/plugins/data/public/', () => ({
  FilterManager: jest.fn().mockImplementation(() => ({
    getFilters: () => mockStoredFilters,
    setFilters: (filters: unknown[]) => {
      mockStoredFilters = filters;
      mockSetFilters(filters);
    },
    addFilters: jest.fn(),
  })),
}));
jest.mock('../../../../../../../../../../../src/plugins/data/common', () => ({
  buildPhraseFilter: jest.fn(),
}));
jest.mock('../flyout-technique/technique-row-details', () => () => null);
jest.mock('../flyout-technique/flyout-technique-columns', () => ({
  techniquesColumns: [],
  agentTechniquesColumns: [],
}));
jest.mock('../../../../../../../common/wazuh-discover/render-columns', () => ({
  wzDiscoverRenderColumns: [],
}));
jest.mock('../../../../../../../common/search-bar/set-filters', () => ({
  setFilters: jest.fn(),
}));
jest.mock('../../../../../../../../components/common/data-source', () => ({
  PatternDataSource: jest.fn(),
  FILTER_OPERATOR: { IS_ONE_OF: 'is one of' },
  PatternDataSourceFilterManager: {
    createFilter: (...args: unknown[]) => mockCreateFilter(...args),
  },
}));
jest.mock('../../../../../../../../redux/store', () => ({
  getState: () => ({ appStateReducers: {} }),
}));
jest.mock('../../../../../../../../components/common/flyouts', () => ({
  WzFlyout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock(
  '../../../../../../../common/wazuh-discover/wz-flyout-discover',
  () => ({
    WazuhFlyoutDiscover: () => <div data-test-subj='discover' />,
  }),
);

const buckets = [
  { key: 'T9992', doc_count: 1 },
  { key: 'T9991', doc_count: 2 },
];

const renderFlyout = (openDiscover = jest.fn()) =>
  render(
    <FlyoutOtherTechniques
      onChangeFlyout={jest.fn()}
      openDiscover={openDiscover}
      indexPatternId='pattern'
      unknownBuckets={buckets}
      fetchFilters={[]}
    />,
  );

describe('FlyoutOtherTechniques', () => {
  beforeEach(() => {
    mockStoredFilters = [];
    jest.clearAllMocks();
  });

  it('lists the unknown technique IDs sorted by count', () => {
    renderFlyout();
    const chips = screen.getAllByText(/T999\d \(\d\)/);
    expect(chips.map(chip => chip.textContent)).toEqual([
      'T9991 (2)',
      'T9992 (1)',
    ]);
  });

  it('filters by the selected IDs and removes the filter when none is left', () => {
    renderFlyout();
    fireEvent.click(screen.getByText('T9991 (2)'));
    fireEvent.click(screen.getByText('T9992 (1)'));
    expect(mockCreateFilter).toHaveBeenLastCalledWith(
      'is one of',
      'wazuh.rule.mitre.technique.id',
      ['T9991', 'T9992'],
      'pattern',
      DATA_SOURCE_FILTER_CONTROLLED_MITRE_OTHER_TECHNIQUE_VALUE,
    );
    fireEvent.click(screen.getByText('T9991 (2)'));
    fireEvent.click(screen.getByText('T9992 (1)'));
    expect(mockStoredFilters).toEqual([]);
  });

  it('opens the findings view', () => {
    const openDiscover = jest.fn();
    renderFlyout(openDiscover);
    fireEvent.click(screen.getByText('Open in Findings'));
    expect(openDiscover).toHaveBeenCalled();
  });
});
