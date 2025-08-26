import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StartCtiRegistration } from './start-cti-registration';

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

const mockUiSettings = {
  get: jest.fn(),
};

const mockGetCore = jest.fn(() => ({
  uiSettings: mockUiSettings,
}));

jest.mock('../../../plugin-services.ts', () => ({
  getCore: jest.fn(),
}));

const { getCore } = require('../../../plugin-services.ts');

describe('StartCtiRegistration component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockImplementation(mockGetCore);
    mockUiSettings.get.mockReturnValue(false);
  });

  it('should render EuiButtonEmpty when newHomePage is disabled', () => {
    mockUiSettings.get.mockReturnValue(false);
    const { getByText, getByRole } = render(
      <StartCtiRegistration handleModalToggle={handleModalToggleMock} />,
    );

    expect(getByText('Register')).toBeInTheDocument();
    expect(getByRole('button')).toHaveClass('euiButtonEmpty');
  });

  it('should render EuiButtonIcon when newHomePage is enabled', async () => {
    mockUiSettings.get.mockReturnValue(true);
    const { getByRole, queryByText, findByText } = render(
      <StartCtiRegistration handleModalToggle={handleModalToggleMock} />,
    );

    expect(queryByText('Register')).not.toBeInTheDocument();

    const buttonIcon = getByRole('button');

    expect(buttonIcon).toHaveAttribute(
      'aria-label',
      'Subscribe to CTI updates',
    );
    fireEvent.mouseEnter(buttonIcon);

    const tooltip = await findByText('Subscribe to CTI updates');
    expect(tooltip).toBeInTheDocument();
  });

  it('should call handleModalToggle when EuiButtonEmpty is clicked', () => {
    mockUiSettings.get.mockReturnValue(false);
    const { getByRole } = render(
      <StartCtiRegistration handleModalToggle={handleModalToggleMock} />,
    );

    fireEvent.click(getByRole('button'));
    expect(handleModalToggleMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleModalToggle when EuiButtonIcon is clicked', () => {
    mockUiSettings.get.mockReturnValue(true);
    const { getByRole } = render(
      <StartCtiRegistration handleModalToggle={handleModalToggleMock} />,
    );

    fireEvent.click(getByRole('button'));
    expect(handleModalToggleMock).toHaveBeenCalledTimes(1);
  });
});
