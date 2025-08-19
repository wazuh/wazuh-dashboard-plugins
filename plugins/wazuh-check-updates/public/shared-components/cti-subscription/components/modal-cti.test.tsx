import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalCti } from './modal-cti';

// Mock @osd/i18n to handle FormattedMessage components
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_: any, opts: any) => opts.defaultMessage,
  },
  __esModule: true,
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: any) => <span>{defaultMessage}</span>,
  __esModule: true,
}));

const handleModalToggleMock = jest.fn();
const handleStatusModalToggleMock = jest.fn();

describe('ModalCti component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn(),
    });
    // Use fake timers to control setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render correctly', () => {
    const { getByText } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        handleStatusModalToggle={handleStatusModalToggleMock}
      />,
    );
    expect(
      getByText('Do you want to subscribe to CTI updates?'),
    ).toBeInTheDocument();
    expect(getByText('Yes, I want to subscribe')).toBeInTheDocument();
  });

  it('should handle button click and open verification URI', async () => {
    const { getByText } = render(
      <ModalCti
        handleModalToggle={handleModalToggleMock}
        handleStatusModalToggle={handleStatusModalToggleMock}
      />,
    );
    const button = getByText('Yes, I want to subscribe');
    act(() => {
      fireEvent.click(button);
      // TODO: remove this advanceTimersByTime when not using fake timers
      // Fast-forward time to complete the setTimeout
      jest.advanceTimersByTime(2000);
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://cti.wazuh.com'),
      '_blank',
    );
  });
});
