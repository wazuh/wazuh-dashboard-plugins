jest.mock('./cti-feed-app', () => ({
  CtiFeedApp: ({ openRegistration }: { openRegistration: boolean }) => (
    <div data-test-subj='ctiFeedApp'>{String(openRegistration)}</div>
  ),
}));

import React from 'react';
import { act } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import type {
  AppMountParameters,
  CoreStart,
} from 'opensearch-dashboards/public';
import { renderCtiFeedApp } from '.';

const mount = (state?: unknown) => {
  const history = createMemoryHistory();
  history.push('/', state);
  const element = document.createElement('div');
  const setBreadcrumbs = jest.fn();
  let unmount: () => void = () => undefined;
  act(() => {
    unmount = renderCtiFeedApp(
      { chrome: { setBreadcrumbs } } as unknown as CoreStart,
      { element, history } as unknown as AppMountParameters,
    );
  });
  return { element, history, setBreadcrumbs, unmount };
};

describe('renderCtiFeedApp', () => {
  test('sets the breadcrumb and renders the app', () => {
    const { element, setBreadcrumbs, unmount } = mount();

    expect(setBreadcrumbs).toHaveBeenCalledWith([{ text: 'CTI feed' }]);
    expect(element.textContent).toBe('false');
    act(() => unmount());
    expect(element.textContent).toBe('');
  });

  test('opens the registration once and clears the request from history', () => {
    const { element, history, unmount } = mount({ openRegistration: true });

    expect(element.textContent).toBe('true');
    expect(history.location.state).toBeUndefined();
    act(() => unmount());
  });
});
