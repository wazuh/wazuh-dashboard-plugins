import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import WzListEditor from './list-editor';

jest.mock('../../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

jest.mock('../../common/resources-handler', () => ({
  ResourcesHandler: jest.fn().mockImplementation(() => ({
    updateFile: jest.fn().mockResolvedValue({ data: {} }),
  })),
  ResourcesConstants: {
    LISTS: 'lists',
  },
  resourceDictionary: {
    lists: {
      resourcePath: '/lists',
      permissionResource: value => `list:file:${value}`,
    },
  },
}));

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

  it('should edit the value correctly or cancel the edit', async () => {
    expect(screen.queryByText('newValue')).toBeFalsy();

    const editButton = screen.queryAllByTestId('editButton');
    fireEvent.click(editButton[0]);

    const valueInput = screen.getByPlaceholderText('New value');

    fireEvent.change(valueInput, { target: { value: 'newValue' } });

    const saveEditButton = screen.getByTestId('saveEditButton');

    fireEvent.click(saveEditButton.closest('button'));

    expect(screen.getByText('newValue')).toBeInTheDocument();

    fireEvent.click(editButton[1]);

    fireEvent.change(valueInput, { target: { value: 'newValue2' } });

    const cancelButton = screen.getByTestId('cancelEditButton');

    fireEvent.click(cancelButton.closest('button'));

    expect(screen.queryByText('newValue2')).toBeFalsy();
  });

  it('should update file correctly', async () => {
    const button = screen.getByText('Add new entry');

    fireEvent.click(button);

    const keyInput = screen.getByPlaceholderText('Key');
    const valueInput = screen.getByPlaceholderText('Value');

    fireEvent.change(keyInput, { target: { value: 'newKey' } });
    fireEvent.change(valueInput, { target: { value: 'newValue' } });

    const addButton = screen.getByText('Add');

    expect(addButton.closest('button')).not.toBeDisabled();

    fireEvent.click(addButton);

    const saveButton = screen.getByText('Save');

    expect(saveButton.closest('button')).not.toBeDisabled();

    fireEvent.click(saveButton);

    expect(screen.getByText('newKey')).toBeInTheDocument();
    expect(screen.getByText('newValue')).toBeInTheDocument();

    // TODO: Add expect to check information message or Restart button
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
