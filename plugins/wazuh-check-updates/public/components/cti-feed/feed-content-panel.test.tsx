import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedContentPanel } from './feed-content-panel';

configure({ testIdAttribute: 'data-test-subj' });

const COUNTS = {
  rules: 365,
  decoders: 514,
  integrations: 127,
  kvdbs: 49,
  iocs: 672843,
  vulnerabilities: null,
};

describe('FeedContentPanel', () => {
  test('shows one tile per content type with its formatted count', () => {
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('ctiFeedContentStat-rules')).toHaveTextContent(
      '365',
    );
    expect(screen.getByTestId('ctiFeedContentStat-iocs')).toHaveTextContent(
      new Intl.NumberFormat().format(672843),
    );
    expect(screen.getByTestId('ctiFeedContentStat-kvdbs')).toHaveTextContent(
      'KVDBs',
    );
  });

  test('marks a count that could not be read', () => {
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('ctiFeedContentStat-vulnerabilities'),
    ).toHaveTextContent('—');
  });

  test('does not show placeholder values while loading', () => {
    render(<FeedContentPanel counts={null} loading onRefresh={jest.fn()} />);

    expect(screen.queryByText('—')).toBeNull();
    expect(screen.getByTestId('ctiFeedContentRefresh')).toBeDisabled();
  });

  test('refreshes the counts on demand', () => {
    const onRefresh = jest.fn();
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByTestId('ctiFeedContentRefresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
