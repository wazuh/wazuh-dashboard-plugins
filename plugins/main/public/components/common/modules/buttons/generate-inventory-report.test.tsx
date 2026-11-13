import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { ButtonInventoryGenerateReport } from './generate-inventory-report';
import { ErrorHandler } from '../../../../react-services/error-management';

jest.mock('../../../../react-services/error-management', () => ({
  ErrorHandler: { handleError: jest.fn() },
  ErrorFactory: { create: (_: unknown, options: unknown) => options },
  HttpError: class {},
}));

const mockStore = configureMockStore();

const renderButton = (tableReportContext: unknown) =>
  render(
    <Provider store={mockStore({ reportingReducers: { tableReportContext } })}>
      <ButtonInventoryGenerateReport />
    </Provider>,
  );

const getButton = () => screen.getByRole('button', { name: 'Generate report' });

describe('ButtonInventoryGenerateReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is disabled when no inventory table is published', () => {
    renderButton(null);

    expect(getButton()).toBeDisabled();
  });

  it('is disabled when the table has no results', () => {
    renderButton({ totalResults: 0, generateReport: jest.fn() });

    expect(getButton()).toBeDisabled();
  });

  it('exports the published table on click', async () => {
    const generateReport = jest.fn().mockResolvedValue(undefined);
    renderButton({ totalResults: 119, generateReport });

    fireEvent.click(getButton());

    await waitFor(() => expect(generateReport).toHaveBeenCalledTimes(1));
    expect(ErrorHandler.handleError).not.toHaveBeenCalled();
  });

  it('reports a failed export', async () => {
    const error = new Error('search failed');
    renderButton({
      totalResults: 119,
      generateReport: jest.fn().mockRejectedValue(error),
    });

    fireEvent.click(getButton());

    await waitFor(() =>
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({ error }),
      ),
    );
  });
});
