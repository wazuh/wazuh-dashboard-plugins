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

describe('ScoreGauge', () => {
  it('renders the formatted score value and the scale captions', () => {
    render(<ScoreGauge score={0.502} data-test-subj='sca-gauge' />);
    expect(screen.getByText('50.2%')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders no marker/value when the score is undefined', () => {
    const { container } = render(<ScoreGauge data-test-subj='sca-gauge' />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });
});
