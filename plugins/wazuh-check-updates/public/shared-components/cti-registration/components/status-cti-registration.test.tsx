import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusCtiRegistration } from './status-cti-registration';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { statusCodes } from '../../../../common/constants';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_: string, opts: { defaultMessage: string }) =>
      opts.defaultMessage,
  },
  __esModule: true,
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => (
    <span>{defaultMessage}</span>
  ),
  __esModule: true,
}));

const mockUiSettings = { get: jest.fn() };

jest.mock('../../../plugin-services', () => ({
  getCore: () => ({ uiSettings: mockUiSettings }),
}));

const renderStatus = (status: statusCodes) =>
  render(
    <StatusCtiRegistration
      statusCTI={{ status, message: '' }}
      refetchStatus={jest.fn()}
      onOpenModal={jest.fn()}
    />,
  );

describe('StatusCtiRegistration component', () => {
  beforeEach(() => {
    mockUiSettings.get.mockReturnValue(false);
    ctiFlowState.setRegistrationComplete(false);
    ctiFlowState.setDeviceCode('device-code');
  });

  afterEach(() => {
    ctiFlowState.setDeviceCode(null);
  });

  it('shows the pending state in words while activation is pending', () => {
    const { getByText, getByRole, container } = renderStatus(
      statusCodes.NOT_FOUND,
    );

    expect(getByText('Wazuh Cloud - Activation pending')).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="ctiStatusBackgroundSpinner"]'),
    ).toBeInTheDocument();
    expect(getByRole('button')).toHaveAttribute(
      'aria-label',
      'Wazuh Cloud activation pending. View activation details.',
    );
  });

  it('keeps the pending accessible name on the new home page badge', () => {
    mockUiSettings.get.mockReturnValue(true);
    const { getByRole, queryByText } = renderStatus(statusCodes.NOT_FOUND);

    expect(queryByText('Wazuh Cloud - Activation pending')).toBeNull();
    expect(getByRole('button')).toHaveAttribute(
      'aria-label',
      'Wazuh Cloud activation pending. View activation details.',
    );
  });

  it('does not show the pending label once registration succeeded', () => {
    const { getByText, queryByText } = renderStatus(statusCodes.SUCCESS);

    expect(getByText('Wazuh Cloud')).toBeInTheDocument();
    expect(queryByText('Wazuh Cloud - Activation pending')).toBeNull();
  });
});
