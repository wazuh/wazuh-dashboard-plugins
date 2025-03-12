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
    updateFile: jest.fn().mockResolvedValue({
      data: {
        error: 0,
        data: 'Success',
      },
    }),
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

const mockAdd = jest.fn();
jest.mock('../../../../../../kibana-services', () => ({
  getToasts: () => ({
    add: mockAdd,
  }),
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
  describe('Without data in the list', () => {
    it('should handle empty list content correctly', async () => {
      const emptyListContent = {
        content: '',
        name: false,
        path: '/lists/startTest',
      };

      render(
        <Provider store={store}>
          <WzListEditor listContent={emptyListContent} />
        </Provider>,
      );

      expect(screen.getByText('No results...')).toBeInTheDocument();

      const saveButton = screen.getByText('Save');

      expect(saveButton.closest('button')).toBeDisabled();

      const addNewEntryButton = screen.getByText('Add new entry');

      fireEvent.click(addNewEntryButton);

      const keyInput = screen.getByPlaceholderText('Key');
      const valueInput = screen.getByPlaceholderText('Value');

      fireEvent.change(keyInput, { target: { value: 'testAddKey' } });
      fireEvent.change(valueInput, { target: { value: 'testAddValue' } });

      const addButton = screen.getByText('Add');

      expect(addButton.closest('button')).not.toBeDisabled();

      fireEvent.click(addButton);

      expect(screen.getByText('testAddKey')).toBeInTheDocument();
      expect(screen.getByText('testAddValue')).toBeInTheDocument();

      expect(saveButton.closest('button')).not.toBeDisabled();

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith({
          title: 'Invalid name',
          color: 'warning',
          text: 'CDB list name cannot be empty',
          toastLifeTimeMs: 3000,
        });
      });

      const nameInput = screen.getByPlaceholderText('New CDB list name');

      fireEvent.change(nameInput, { target: { value: 'test' } });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith({
          title: 'Success',
          color: 'success',
          text: 'CBD List successfully created',
          toastLifeTimeMs: 3000,
        });
      });
    });
  });

  describe('With data in the list', () => {
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
      simbolsError:
        'Must not contain simbols when using quotes(only letters, numbers and colon)',
    };

    beforeEach(() => {
      const cdblistMap = cdblist.map(item => {
        return `${item.key}:${item.value}`;
      });

      const listContent = {
        name: 'testName',
        content: `${cdblistMap.join('\n')}`,
        path: '/lists/test',
      };

      render(
        <Provider store={store}>
          <WzListEditor listContent={listContent} />
        </Provider>,
      );
    });

    afterEach(() => {
      mockAdd.mockClear();
    });

    it('should render the component', () => {
      expect(screen.getByText('testName')).toBeInTheDocument();
      expect(screen.getByText('/lists/test')).toBeInTheDocument();

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

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith({
          title: 'Success',
          color: 'success',
          text: 'CBD List updated',
          toastLifeTimeMs: 3000,
        });
      });
    });

    it('should render the message when try to add duplicated key', async () => {
      expect(screen.queryAllByText('test')).toHaveLength(1);

      const button = screen.getByText('Add new entry');
      fireEvent.click(button);

      const keyInput = screen.getByPlaceholderText('Key');
      const valueInput = screen.getByPlaceholderText('Value');

      fireEvent.change(keyInput, { target: { value: 'test' } });
      fireEvent.change(valueInput, { target: { value: 'testValue' } });

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(mockAdd).toHaveBeenCalledWith({
        title: 'Error',
        color: 'danger',
        text: (
          <React.Fragment>
            <strong>test</strong> key already exists
          </React.Fragment>
        ),
        toastLifeTimeMs: 3000,
      });

      expect(screen.queryAllByText('test')).toHaveLength(1);
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
      async ({ key, value }: { key: string; value: string }) => {
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

        const saveButton = screen.getByText('Save');

        expect(saveButton.closest('button')).not.toBeDisabled();

        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockAdd).toHaveBeenCalledWith({
            title: 'Success',
            color: 'success',
            text: 'CBD List updated',
            toastLifeTimeMs: 3000,
          });
        });
      },
    );

    it.each`
      key            | value              | quotesError                  | colonError                  | simbolsError
      ${'":key'}     | ${'value'}         | ${messagesError.quotesError} | ${messagesError.colonError} | ${''}
      ${'".key"'}    | ${'":value'}       | ${messagesError.quotesError} | ${messagesError.colonError} | ${messagesError.simbolsError}
      ${'key"key'}   | ${'"value(*&"'}    | ${messagesError.quotesError} | ${''}                       | ${messagesError.simbolsError}
      ${'key'}       | ${'value"value'}   | ${messagesError.quotesError} | ${''}                       | ${''}
      ${'"key!@#"'}  | ${'value"'}        | ${messagesError.quotesError} | ${''}                       | ${messagesError.simbolsError}
      ${'"key."'}    | ${'"value'}        | ${messagesError.quotesError} | ${''}                       | ${messagesError.simbolsError}
      ${'"key"key"'} | ${'value'}         | ${messagesError.quotesError} | ${''}                       | ${messagesError.simbolsError}
      ${'key'}       | ${'"value"value"'} | ${messagesError.quotesError} | ${''}                       | ${messagesError.simbolsError}
      ${'key:key'}   | ${'"value;"'}      | ${''}                        | ${messagesError.colonError} | ${messagesError.simbolsError}
      ${'key:"key"'} | ${'value'}         | ${messagesError.quotesError} | ${messagesError.colonError} | ${''}
      ${'key'}       | ${':value'}        | ${''}                        | ${messagesError.colonError} | ${''}
      ${'"key:key"'} | ${'"value":'}      | ${messagesError.quotesError} | ${messagesError.colonError} | ${''}
    `(
      'should render the message when try to add invalid key($key) or value($value)',
      ({
        key,
        value,
        quotesError,
        colonError,
        simbolsError,
      }: {
        key: string;
        value: string;
        quotesError: string;
        colonError: string;
        simbolsError: string;
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

        if (simbolsError) {
          expect(screen.getByText(simbolsError)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(messagesError.simbolsError)).toBeFalsy();
        }
      },
    );
  });
});
