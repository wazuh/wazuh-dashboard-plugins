import { createMemoryHistory, History } from 'history';
import { renderHook, act } from '@testing-library/react';
import { useRouterSearch } from './use-router-search';
import NavigationService from '../../../react-services/navigation-service';

describe('useRouterSearch hook', () => {
  let history: History;

  beforeEach(() => {
    history = createMemoryHistory();
    NavigationService.getInstance(history);
  });

  it('returns the current search params on mount', () => {
    history.push('/settings?tab=configuration&category=cluster');

    const { result } = renderHook(() => useRouterSearch());

    expect(result.current).toEqual({
      tab: 'configuration',
      category: 'cluster',
    });
  });

  it('resyncs the search params when the history changes without the owning component re-rendering', () => {
    history.push('/settings?tab=configuration&category=cluster');

    const { result } = renderHook(() => useRouterSearch());

    act(() => {
      history.push('/settings?tab=configuration&category=indexer');
    });

    expect(result.current).toEqual({
      tab: 'configuration',
      category: 'indexer',
    });
  });

  it('resyncs on browser back/forward (a POP navigation), not just PUSH', () => {
    history.push('/settings?tab=configuration');
    history.push('/settings?tab=configuration&category=cluster');
    history.push('/settings?tab=configuration&category=indexer');

    const { result } = renderHook(() => useRouterSearch());

    act(() => {
      history.goBack();
    });
    act(() => {
      history.goBack();
    });

    expect(result.current).toEqual({ tab: 'configuration' });
  });

  it('stops updating after unmount', () => {
    history.push('/settings?tab=configuration&category=cluster');

    const { result, unmount } = renderHook(() => useRouterSearch());

    unmount();

    act(() => {
      history.push('/settings?tab=configuration&category=indexer');
    });

    expect(result.current).toEqual({
      tab: 'configuration',
      category: 'cluster',
    });
  });
});
