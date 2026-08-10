import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ScaTiles } from './sca-tiles';
import { getConfigurationAssessmentByStatusUrl } from '../../utils/navigation';
import { CheckResult } from '../../../../../overview/sca/utils/constants';

jest.mock('../../utils/navigation', () => ({
  getConfigurationAssessmentByStatusUrl: jest.fn(() => '#sca-filtered'),
}));

const tiles = { passed: 478, failed: 717, notApplicable: 70, score: 40 };

describe('ScaTiles', () => {
  it('renders the Passed/Failed/N-A counts as plain text with no index pattern', () => {
    render(<ScaTiles tiles={tiles} />);
    expect(screen.getByText('478')).toBeInTheDocument();
    expect(screen.getByText('717')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(getConfigurationAssessmentByStatusUrl).not.toHaveBeenCalled();
  });

  it('links each count to Inventory filtered by its check.result once an index pattern is available', () => {
    const { container } = render(
      <ScaTiles tiles={tiles} indexPatternId='idx-sca' />,
    );
    expect(
      container.querySelector('[data-test-subj="sca-tile-passed-link"]'),
    ).toBeInTheDocument();
    expect(getConfigurationAssessmentByStatusUrl).toHaveBeenCalledWith(
      CheckResult.Passed,
      'idx-sca',
    );
    expect(getConfigurationAssessmentByStatusUrl).toHaveBeenCalledWith(
      CheckResult.Failed,
      'idx-sca',
    );
    expect(getConfigurationAssessmentByStatusUrl).toHaveBeenCalledWith(
      CheckResult.NotApplicable,
      'idx-sca',
    );
  });
});
