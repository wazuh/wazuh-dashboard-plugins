/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SearchBar } from '../index';
import { AQL, getSuggestions, tokenizer } from './aql';

describe('SearchBar component', () => {
  const componentProps = {
    defaultMode: AQL.id,
    input: '',
    modes: [
      {
        id: AQL.id,
        implicitQuery: 'id!=000;',
        suggestions: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          field(currentValue) {
            return [];
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          value(currentValue, { previousField }) {
            return [];
          },
        },
      },
    ],
    /* eslint-disable @typescript-eslint/no-empty-function */
    onChange: () => {},
    onSearch: () => {},
    /* eslint-enable @typescript-eslint/no-empty-function */
  };

  it('Renders correctly to match the snapshot of query language', async () => {
    const wrapper = render(<SearchBar {...componentProps} />);

    await waitFor(() => {
      const elementImplicitQuery = wrapper.container.querySelector(
        '.euiCodeBlock__code',
      );

      expect(elementImplicitQuery?.innerHTML).toEqual('id!=000;');
      expect(wrapper.container).toMatchSnapshot();
    });
  });
});

describe('Query language - AQL', () => {
  // Tokenize the input
  it.each`
    input                                | tokens
    ${''}                                | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'f'}                               | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'f' }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field'}                           | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field='}                          | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value'}                     | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value with spaces'}         | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value with spaces' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value with spaces<'}        | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value with spaces<' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value with (parenthesis)'}  | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value with (parenthesis)' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value;'}                    | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value;field2'}              | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value;field2!='}            | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '!=' }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'field=value;field2!=value2'}      | ${[{ type: 'operator_group', value: undefined }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '!=' }, { type: 'value', value: 'value2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'('}                               | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field'}                          | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>'}                         | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2'}                        | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2)'}                       | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: ')' }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2);'}                      | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: ')' }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2;'}                       | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2;field2'}                 | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2;field2='}                | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2;field2=value2'}          | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2;field2=value2)'}         | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value2' }, { type: 'operator_group', value: ')' }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
    ${'(field>2;field2=custom value())'} | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }, { type: 'value', value: '2' }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: ';' }, { type: 'operator_group', value: undefined }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'custom value()' }, { type: 'operator_group', value: ')' }, { type: 'conjunction', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'field', value: undefined }, { type: 'operator_compare', value: undefined }, { type: 'value', value: undefined }, { type: 'operator_group', value: undefined }, { type: 'conjunction', value: undefined }]}
  `(`Tokenizer API input $input`, ({ input, tokens }) => {
    expect(tokenizer(input)).toEqual(tokens);
  });

  // Get suggestions
  it.each`
    input                       | suggestions
    ${''}                       | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }, { description: 'open group', label: '(', type: 'operator_group' }]}
    ${'w'}                      | ${[]}
    ${'f'}                      | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }]}
    ${'field'}                  | ${[{ description: 'Field2', label: 'field2', type: 'field' }, { description: 'equality', label: '=', type: 'operator_compare' }, { description: 'not equality', label: '!=', type: 'operator_compare' }, { description: 'bigger', label: '>', type: 'operator_compare' }, { description: 'smaller', label: '<', type: 'operator_compare' }, { description: 'like as', label: '~', type: 'operator_compare' }]}
    ${'field='}                 | ${[{ label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }]}
    ${'field=v'}                | ${[{ description: 'run the search query', label: 'Search', type: 'function_search' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: ';', type: 'conjunction' }, { description: 'or', label: ',', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value'}            | ${[{ description: 'run the search query', label: 'Search', type: 'function_search' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: ';', type: 'conjunction' }, { description: 'or', label: ',', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value;'}           | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }, { description: 'open group', label: '(', type: 'operator_group' }]}
    ${'field=value;field2'}     | ${[{ description: 'equality', label: '=', type: 'operator_compare' }, { description: 'not equality', label: '!=', type: 'operator_compare' }, { description: 'bigger', label: '>', type: 'operator_compare' }, { description: 'smaller', label: '<', type: 'operator_compare' }, { description: 'like as', label: '~', type: 'operator_compare' }]}
    ${'field=value;field2='}    | ${[{ label: '127.0.0.1', type: 'value' }, { label: '127.0.0.2', type: 'value' }, { label: '190.0.0.1', type: 'value' }, { label: '190.0.0.2', type: 'value' }]}
    ${'field=value;field2=127'} | ${[{ description: 'run the search query', label: 'Search', type: 'function_search' }, { label: '127.0.0.1', type: 'value' }, { label: '127.0.0.2', type: 'value' }, { description: 'and', label: ';', type: 'conjunction' }, { description: 'or', label: ',', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
  `('Get suggestion from the input: $input', async ({ input, suggestions }) => {
    expect(
      await getSuggestions(tokenizer(input), {
        id: 'aql',
        suggestions: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          field(currentValue) {
            return [
              { label: 'field', description: 'Field' },
              { label: 'field2', description: 'Field2' },
            ].map(({ label, description }) => {
              return {
                type: 'field',
                label,
                description,
              };
            });
          },
          // eslint-disable-next-line default-param-last
          value(currentValue = '', { previousField }) {
            switch (previousField) {
              case 'field': {
                return ['value', 'value2', 'value3', 'value4']
                  .filter(value => value.startsWith(currentValue))
                  .map(value => {
                    return { type: 'value', label: value };
                  });
              }

              case 'field2': {
                return ['127.0.0.1', '127.0.0.2', '190.0.0.1', '190.0.0.2']
                  .filter(value => value.startsWith(currentValue))
                  .map(value => {
                    return { type: 'value', label: value };
                  });
              }

              default: {
                return [];
              }
            }
          },
        },
      }),
    ).toEqual(suggestions);
  });

  // When a suggestion is clicked, change the input text
  it.each`
    AQL                             | clikedSuggestion                                                             | changedInput
    ${''}                           | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field' }}        | ${'field'}
    ${'field'}                      | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}       | ${'field2'}
    ${'field'}                      | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '=' }}          | ${'field='}
    ${'field='}                     | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value' }}        | ${'field=value'}
    ${'field='}                     | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '!=' }}         | ${'field!='}
    ${'field=value'}                | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2' }}       | ${'field=value2'}
    ${'field=value'}                | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: ';' }}         | ${'field=value;'}
    ${'field=value;'}               | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}       | ${'field=value;field2'}
    ${'field=value;field2'}         | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>' }}          | ${'field=value;field2>'}
    ${'field='}                     | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with spaces' }}  | ${'field=with spaces'}
    ${'field='}                     | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with "spaces' }} | ${'field=with "spaces'}
    ${'field='}                     | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: '"value' }}       | ${'field="value'}
    ${''}                           | ${{ type: { iconType: 'tokenDenseVector', color: 'tint3' }, label: '(' }}    | ${'('}
    ${'('}                          | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field' }}        | ${'(field'}
    ${'(field'}                     | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}       | ${'(field2'}
    ${'(field'}                     | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '=' }}          | ${'(field='}
    ${'(field='}                    | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value' }}        | ${'(field=value'}
    ${'(field=value'}               | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2' }}       | ${'(field=value2'}
    ${'(field=value'}               | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: ',' }}         | ${'(field=value,'}
    ${'(field=value,'}              | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}       | ${'(field=value,field2'}
    ${'(field=value,field2'}        | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>' }}          | ${'(field=value,field2>'}
    ${'(field=value,field2>'}       | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>' }}          | ${'(field=value,field2>'}
    ${'(field=value,field2>'}       | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '~' }}          | ${'(field=value,field2~'}
    ${'(field=value,field2>'}       | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2' }}       | ${'(field=value,field2>value2'}
    ${'(field=value,field2>value2'} | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value3' }}       | ${'(field=value,field2>value3'}
    ${'(field=value,field2>value2'} | ${{ type: { iconType: 'tokenDenseVector', color: 'tint3' }, label: ')' }}    | ${'(field=value,field2>value2)'}
  `(
    'click suggestion - AQL "$AQL" => "$changedInput"',
    async ({ AQL: currentInput, clikedSuggestion, changedInput }) => {
      // Mock input
      let input = currentInput;
      const qlOutput = await AQL.run(input, {
        setInput: (value: string): void => {
          input = value;
        },
        queryLanguage: {
          parameters: {
            implicitQuery: '',
            suggestions: {
              field: () => [],
              value: () => [],
            },
          },
        },
      });

      qlOutput.searchBarProps.onItemClick('')(clikedSuggestion);
      expect(input).toEqual(changedInput);
    },
  );

  // Transform the external input in UQL (Unified Query Language) to QL
  it.each`
    UQL                              | AQL
    ${''}                            | ${''}
    ${'field'}                       | ${'field'}
    ${'field='}                      | ${'field='}
    ${'field!='}                     | ${'field!='}
    ${'field>'}                      | ${'field>'}
    ${'field<'}                      | ${'field<'}
    ${'field~'}                      | ${'field~'}
    ${'field=value'}                 | ${'field=value'}
    ${'field=value;'}                | ${'field=value;'}
    ${'field=value;field2'}          | ${'field=value;field2'}
    ${'field="'}                     | ${'field="'}
    ${'field=with spaces'}           | ${'field=with spaces'}
    ${'field=with "spaces'}          | ${'field=with "spaces'}
    ${'('}                           | ${'('}
    ${'(field'}                      | ${'(field'}
    ${'(field='}                     | ${'(field='}
    ${'(field=value'}                | ${'(field=value'}
    ${'(field=value,'}               | ${'(field=value,'}
    ${'(field=value,field2'}         | ${'(field=value,field2'}
    ${'(field=value,field2>'}        | ${'(field=value,field2>'}
    ${'(field=value,field2>value2'}  | ${'(field=value,field2>value2'}
    ${'(field=value,field2>value2)'} | ${'(field=value,field2>value2)'}
  `(
    'Transform the external input UQL to QL - UQL $UQL => $AQL',
    async ({ UQL, AQL: changedInput }) => {
      expect(AQL.transformUQLToQL(UQL)).toEqual(changedInput);
    },
  );
});
