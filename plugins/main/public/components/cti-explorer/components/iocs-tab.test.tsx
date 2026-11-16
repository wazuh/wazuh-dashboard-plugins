import '@testing-library/jest-dom';
import React from 'react';
import { configure, fireEvent, render, waitFor } from '@testing-library/react';
import type { IocSummaryResponse } from '../../../../common/cti-explorer/types';
import type { CtiRequestState } from '../hooks/use-cti-request';
import { searchIocs } from '../services/cti-explorer-api';
import { IocsTab } from './iocs-tab';

configure({ testIdAttribute: 'data-test-subj' });

jest.mock('../services/cti-explorer-api', () => ({
  ...jest.requireActual('../services/cti-explorer-api'),
  searchIocs: jest.fn(),
}));
// The CSV export reads its row limit from the app settings in the store.
jest.mock('../../common/hooks/use-app-config', () => ({
  useAppConfig: () => ({ data: {} }),
}));

const mockSearch = searchIocs as jest.Mock;
const scrollIntoView = jest.fn();

const summary = (loading: boolean): CtiRequestState<IocSummaryResponse> => ({
  loading,
  data: null,
  error: null,
  reload: jest.fn(),
});

const renderTab = (props: Partial<React.ComponentProps<typeof IocsTab>>) => (
  <IocsTab
    summary={summary(false)}
    filters={{}}
    onFiltersChange={jest.fn()}
    onOpenIoc={jest.fn()}
    {...props}
  />
);

describe('IocsTab', () => {
  beforeAll(() => {
    // jsdom does not implement scrolling.
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  beforeEach(() => {
    scrollIntoView.mockReset();
    mockSearch.mockReset();
    // The list stays loading: these tests are about what happens around it.
    mockSearch.mockReturnValue(new Promise(() => undefined));
  });

  it('lists the IOCs with the filters it is given', async () => {
    mockSearch.mockResolvedValue({ total: 0, items: [] });
    const { findByText } = render(
      renderTab({ filters: { type: 'url_domain' } }),
    );
    await findByText('No IOCs match these filters');
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { type: 'url_domain' } }),
      ),
    );
  });

  it('does not scroll on its own', () => {
    render(renderTab({}));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('keeps the list in view until the catalog above it has loaded', () => {
    const onListScrolled = jest.fn();
    const { rerender, getByTestId } = render(
      renderTab({ summary: summary(true), scrollToList: true, onListScrolled }),
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toContainElement(
      getByTestId('ctiExplorerIocList'),
    );
    expect(onListScrolled).not.toHaveBeenCalled();

    // The catalog loaded and grew: scroll again, then release.
    rerender(
      renderTab({
        summary: summary(false),
        scrollToList: true,
        onListScrolled,
      }),
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(onListScrolled).toHaveBeenCalledTimes(1);
  });

  it('leaves the list below the fixed headers of the page', () => {
    // The fixed headers pad the body by their height.
    document.body.style.paddingTop = '49px';
    const { getByTestId } = render(renderTab({ scrollToList: true }));
    expect(
      getByTestId('ctiExplorerIocList').parentElement!.style.scrollMarginTop,
    ).toBe('57px');
    document.body.style.paddingTop = '';
  });

  it('releases the list as soon as the user scrolls', () => {
    const onListScrolled = jest.fn();
    render(
      renderTab({ summary: summary(true), scrollToList: true, onListScrolled }),
    );
    fireEvent.wheel(window);
    expect(onListScrolled).toHaveBeenCalledTimes(1);
  });
});
