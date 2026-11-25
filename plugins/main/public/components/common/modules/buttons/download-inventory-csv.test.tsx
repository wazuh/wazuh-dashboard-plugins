import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { ButtonInventoryDownloadCsv } from './download-inventory-csv';
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
      <ButtonInventoryDownloadCsv />
    </Provider>,
  );

const getButton = () => screen.getByRole('button', { name: 'Download CSV' });

describe('ButtonInventoryDownloadCsv', () => {
  beforeEach(() => jest.clearAllMocks());

  it('names the CSV format, not a report', () => {
    renderButton({ totalResults: 119, generateReport: jest.fn() });

    expect(getButton()).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate report' }),
    ).not.toBeInTheDocument();
  });

  it('explains why it is disabled when the table has no results', async () => {
    renderButton({ totalResults: 0, generateReport: jest.fn() });

    fireEvent.mouseOver(getButton().parentElement as HTMLElement);

    expect(
      await screen.findByText('No results match for this search criteria.'),
    ).toBeInTheDocument();
  });

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
