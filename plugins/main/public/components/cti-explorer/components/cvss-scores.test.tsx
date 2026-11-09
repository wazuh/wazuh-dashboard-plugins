import '@testing-library/jest-dom';
import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { CveScore } from '../../../../common/cti-explorer/cve-record';
import { CvssScores } from './cvss-scores';

configure({ testIdAttribute: 'data-test-subj' });

const score = (
  value: number,
  severity: CveScore['severity'],
  version = '3.1',
): CveScore => ({
  source: 'cna',
  version,
  score: value,
  severity,
  vector: null,
});

const badgeTexts = () =>
  screen.getAllByTestId('ctiExplorerCvssScore').map(badge => badge.textContent);

describe('CvssScores', () => {
  it('shows a dash without scores', () => {
    render(<CvssScores scores={[]} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows every score, highest first, without a "more" link up to three', () => {
    render(
      <CvssScores
        scores={[score(5.3, 'medium'), score(9.8, 'critical', '4.0')]}
      />,
    );
    expect(badgeTexts()).toEqual(['9.8', '5.3']);
    expect(
      screen.queryByTestId('ctiExplorerCvssScoresMore'),
    ).not.toBeInTheDocument();
  });

  it('lists the scores past the third one in a popover', async () => {
    const onRowClick = jest.fn();
    render(
      <div onClick={onRowClick}>
        <CvssScores
          scores={[
            score(2.1, 'low', '2.0'),
            score(7.5, 'high'),
            score(9.8, 'critical', '4.0'),
            score(5.3, 'medium'),
            score(7.5, 'high', '4.0'),
          ]}
        />
      </div>,
    );
    expect(badgeTexts()).toEqual(['9.8', '7.5', '7.5']);

    const more = screen.getByTestId('ctiExplorerCvssScoresMore');
    expect(more).toHaveTextContent('+2 more');
    fireEvent.click(more);
    // Opening the popover does not open the record of the row.
    expect(onRowClick).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(
        screen.getByTestId('ctiExplorerCvssScoresHidden'),
      ).toBeInTheDocument(),
    );
    expect(badgeTexts()).toEqual(['9.8', '7.5', '7.5', '5.3', '2.1']);
  });
});
