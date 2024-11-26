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

  const cdblistErrors = [
    {
      key: '":key',
      value: 'value',
    },
    {
      key: 'key',
      value: '":value',
    },
    {
      key: 'key"key',
      value: 'value',
    },
    {
      key: 'key',
      value: 'value"value',
    },
    {
      key: 'key',
      value: 'value"',
    },
    {
      key: 'key',
      value: '"value',
    },
    {
      key: '"key"key"',
      value: 'value',
    },
    {
      key: 'key',
      value: '"value"value"',
    },
    {
      key: 'key:"key',
      value: 'value',
    },
  ];

  beforeEach(() => {
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
  });

  it('should render the component', () => {
    cdblist.forEach(item => {
      expect(screen.getByText(item.key)).toBeInTheDocument();
      if (!item.value === '') {
        expect(screen.getByText(item.value)).toBeInTheDocument();
      }
      expect(screen.queryByText(`${item.key}:${item.value}`)).toBeFalsy();
    });
  });

  it('shoudl render the message when try to add invalid key or value', () => {
    const button = screen.getByText('Add new entry');

    fireEvent.click(button);

    const keyInput = screen.getByPlaceholderText('Key');
    const valueInput = screen.getByPlaceholderText('Value');

    cdblistErrors.forEach(item => {
      fireEvent.change(keyInput, { target: { value: item.key } });
      fireEvent.change(valueInput, { target: { value: item.value } });
      expect(
        screen.getByText(
          'Must start and end with quotes or have no quotes at all',
        ),
      ).toBeInTheDocument();
    });
  });
});
