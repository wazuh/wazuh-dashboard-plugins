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
      key: 'test1',
      value: '":key"',
    },
    {
      key: '":test1"',
      value: 'value1',
    },
    {
      key: '"test2"',
      value: '"value2"',
    },
    {
      key: 'test3',
      value: '',
    },
    {
      key: '"a0:a0:a0:a0:a0:a0"',
      value: '',
    },
  ];

  const messagesError = {
    quotesError: 'Must start and end with quotes or have no quotes at all',
    colonError: 'Must start and end with quotes when using colon',
  };

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
      if (!(item.value === '')) {
        expect(screen.getByText(item.value)).toBeInTheDocument();
      }
      expect(screen.queryByText(`${item.key}:${item.value}`)).toBeFalsy();
    });
  });

  it('should delete the item correctly', async () => {
    const deleteButton = screen.queryAllByTestId('deleteButton');
    fireEvent.click(deleteButton[0].closest('button'));

    expect(screen.queryByText(cdblist[0].key)).toBeFalsy();
  });

  it.each`
    key                      | value
    ${'key'}                 | ${'value'}
    ${'"key"'}               | ${'value'}
    ${'"key"'}               | ${'"value"'}
    ${'"key:key"'}           | ${'value'}
    ${'"key:key"'}           | ${'"value:value"'}
    ${'"key"'}               | ${'"value:value"'}
    ${'key'}                 | ${'"value:value"'}
    ${'key'}                 | ${''}
    ${'"key"'}               | ${''}
    ${'"key:key"'}           | ${''}
    ${'"b1:b1:b1:b1:b1:b1"'} | ${'test6'}
  `(
    'should add keys($key) and values($value) correctly',
    ({ key, value }: { key: string; value: string }) => {
      const button = screen.getByText('Add new entry');
      fireEvent.click(button);

      const keyInput = screen.getByPlaceholderText('Key');
      const valueInput = screen.getByPlaceholderText('Value');

      fireEvent.change(keyInput, { target: { value: key } });
      fireEvent.change(valueInput, { target: { value: value } });

      const addButton = screen.getByText('Add');

      expect(addButton.closest('button')).not.toBeDisabled();

      fireEvent.click(addButton);

      expect(screen.getByText(key)).toBeInTheDocument();
      if (!(value === '')) {
        expect(screen.getByText(value)).toBeInTheDocument();
      }
    },
  );

  it.each`
    key            | value              | quotesError                  | colonError
    ${'":key'}     | ${'value'}         | ${messagesError.quotesError} | ${messagesError.colonError}
    ${'key'}       | ${'":value'}       | ${messagesError.quotesError} | ${messagesError.colonError}
    ${'key"key'}   | ${'value'}         | ${messagesError.quotesError} | ${''}
    ${'key'}       | ${'value"value'}   | ${messagesError.quotesError} | ${''}
    ${'key'}       | ${'value"'}        | ${messagesError.quotesError} | ${''}
    ${'key'}       | ${'"value'}        | ${messagesError.quotesError} | ${''}
    ${'"key"key"'} | ${'value'}         | ${messagesError.quotesError} | ${''}
    ${'key'}       | ${'"value"value"'} | ${messagesError.quotesError} | ${''}
    ${'key:key'}   | ${'value'}         | ${''}                        | ${messagesError.colonError}
    ${'key:"key"'} | ${'value'}         | ${messagesError.quotesError} | ${messagesError.colonError}
    ${'key'}       | ${':value'}        | ${''}                        | ${messagesError.colonError}
    ${'"key:key"'} | ${'"value":'}      | ${messagesError.quotesError} | ${messagesError.colonError}
  `(
    'should render the message when try to add invalid key($key) or value($value)',
    ({
      key,
      value,
      quotesError,
      colonError,
    }: {
      key: string;
      value: string;
      quotesError: string;
      colonError: string;
    }) => {
      const button = screen.getByText('Add new entry');
      fireEvent.click(button);

      const keyInput = screen.getByPlaceholderText('Key');
      const valueInput = screen.getByPlaceholderText('Value');

      fireEvent.change(keyInput, { target: { value: key } });
      fireEvent.change(valueInput, { target: { value: value } });

      const addButton = screen.getByText('Add');

      expect(addButton.closest('button')).toBeDisabled();

      if (quotesError) {
        expect(screen.getByText(quotesError)).toBeInTheDocument();
      } else {
        expect(screen.queryByText(messagesError.quotesError)).toBeFalsy();
      }

      if (colonError) {
        expect(screen.getByText(colonError)).toBeInTheDocument();
      } else {
        expect(screen.queryByText(messagesError.colonError)).toBeFalsy();
      }
    },
  );
});
