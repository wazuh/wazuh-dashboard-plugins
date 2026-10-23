jest.mock('../../plugin-services', () => ({
  getWazuhCore: jest.fn(),
}));

import React from 'react';
import { act, configure, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getWazuhCore } from '../../plugin-services';
import { CTI_TIMESTAMP_TICK_MS, CtiTimestamp } from './cti-timestamp';

configure({ testIdAttribute: 'data-test-subj' });

const renderTimestamp = (timestamp?: string) =>
  render(
    <CtiTimestamp
      timestamp={timestamp}
      renderText={time => `Last updated: ${time}`}
      dataTestSubj='timestamp'
    />,
  );

describe('CtiTimestamp', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2026-05-21T12:30:00Z'));
    (getWazuhCore as jest.Mock).mockReturnValue({
      utils: { formatUIDate: (date: string) => `formatted ${date}` },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('says how long ago the time was', () => {
    renderTimestamp('2026-05-21T12:25:00Z');

    const timestamp = screen.getByTestId('timestamp');
    expect(timestamp).toHaveTextContent('Last updated: 5 minutes ago');
    expect(timestamp.querySelector('time')).toHaveAttribute(
      'dateTime',
      '2026-05-21T12:25:00Z',
    );
  });

  test('keeps the relative time current while the page stays open', () => {
    renderTimestamp('2026-05-21T12:25:00Z');

    act(() => {
      jest.advanceTimersByTime(CTI_TIMESTAMP_TICK_MS * 5);
    });

    expect(screen.getByTestId('timestamp')).toHaveTextContent(
      'Last updated: 10 minutes ago',
    );
  });

  test.each([undefined, 'not a date'])(
    'shows a dash for %p, keeping the label',
    timestamp => {
      renderTimestamp(timestamp);

      const element = screen.getByTestId('timestamp');
      expect(element).toHaveTextContent('Last updated: -');
      expect(element.querySelector('time')).toBeNull();
    },
  );
});
