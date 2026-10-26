import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
jest.mock('../../../utils/helpers', () => ({
  decimalFormat: () => ({
    convert: (value: number) => `${Math.round(value * 1000) / 10}%`,
  }),
}));
import { ScoreGauge } from './score-gauge';
import { HOME_OVERVIEW_COLOR } from '../../lib/theme-colors';

describe('ScoreGauge', () => {
  it('renders the formatted score value and the scale captions', () => {
    render(<ScoreGauge score={0.502} data-test-subj='sca-gauge' />);
    expect(screen.getByText('50.2%')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('colors the value with a theme-aware CSS custom property, not a frozen hex', () => {
    render(<ScoreGauge score={0.502} data-test-subj='sca-gauge' />);
    expect(screen.getByText('50.2%')).toHaveStyle({
      color: HOME_OVERVIEW_COLOR.warning,
    });
  });

  it('renders no marker/value when the score is undefined', () => {
    const { container } = render(<ScoreGauge data-test-subj='sca-gauge' />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });

  it('shows the empty message instead of the track when there is no score', () => {
    render(<ScoreGauge emptyMessage='No score' data-test-subj='sca-gauge' />);
    expect(screen.getByText('No score')).toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('ignores the empty message when there is a score', () => {
    render(<ScoreGauge score={0} emptyMessage='No score' />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText('No score')).not.toBeInTheDocument();
  });
});
