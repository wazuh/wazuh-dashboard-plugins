import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import WzListEditor from './list-editor';

const mockStore = configureMockStore();
const store = mockStore({
  appStateReducers: {
    userAccount: {
      administrator: true,
    },
    withUserLogged: true,
    userPermissions: {
      'lists:read': { '*:*:*': 'allow' },
    },
  },
});

describe('WzListEditor', () => {
  const cdblist = [
    {
      key: 'test',
      value: 'testValue',
    },
    {
      key: '":test"',
      value: '":testValue"',
    },
    {
      key: 'key',
      value: '":key"',
    },
    {
      key: '":key1"',
      value: 'value1',
    },
    {
      key: '"key2"',
      value: '"value2"',
    },
    {
      key: 'key3',
      value: '',
    },
    {
      key: '"a0:a0:a0:a0:a0:a0"',
      value: '',
    },
    {
      key: '"b1:b1:b1:b1:b1:b1"',
      value: '"test:6"',
    },
  ];

  it('should render the component', () => {
    const cdblistMap = cdblist.map(item => {
      return `${item.key}:${item.value}`;
    });

    const listContent = {
      content: `${cdblistMap.join('\n')}`,
    };

    render(
      <Provider store={store}>
        <WzListEditor listContent={listContent} />
      </Provider>,
    );

    cdblist.forEach(item => {
      expect(screen.getByText(item.key)).toBeInTheDocument();
      if (!item.value === '') {
        expect(screen.getByText(item.value)).toBeInTheDocument();
      }
      expect(screen.queryByText(`${item.key}:${item.value}`)).toBeFalsy();
    });
  });
});
