import { getSuggestions, tokenizer } from './aql';

describe('Query language - AQL', () => {
  // Tokenize the input
  it.each`
    input                                          | tokens
    ${''}                                          | ${[]}
    ${'f'}                                         | ${[{ type: 'field', value: 'f' }]}
    ${'field'}                                     | ${[{ type: 'field', value: 'field' }]}
    ${'field.subfield'}                            | ${[{ type: 'field', value: 'field.subfield' }]}
    ${'field='}                                    | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }]}
    ${'field!='}                                   | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '!=' }]}
    ${'field>'}                                    | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }]}
    ${'field<'}                                    | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '<' }]}
    ${'field~'}                                    | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '~' }]}
    ${'field=value'}                               | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }]}
    ${'field=value;'}                              | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ';' }]}
    ${'field=value,'}                              | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ',' }]}
    ${'field=value,field2'}                        | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ',' }, { type: 'field', value: 'field2' }]}
    ${'field=value,field2.subfield'}               | ${[{ type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ',' }, { type: 'field', value: 'field2.subfield' }]}
    ${'('}                                         | ${[{ type: 'operator_group', value: '(' }]}
    ${'(f'}                                        | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'f' }]}
    ${'(field'}                                    | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }]}
    ${'(field.subfield'}                           | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field.subfield' }]}
    ${'(field='}                                   | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }]}
    ${'(field!='}                                  | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '!=' }]}
    ${'(field>'}                                   | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '>' }]}
    ${'(field<'}                                   | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '<' }]}
    ${'(field~'}                                   | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '~' }]}
    ${'(field=value'}                              | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }]}
    ${'(field=value,field2=value2)'}               | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ',' }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value2' }, { type: 'operator_group', value: ')' }]}
    ${'(field=value;field2=value2)'}               | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ';' }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value2' }, { type: 'operator_group', value: ')' }]}
    ${'(field=value;field2=value2),field3=value3'} | ${[{ type: 'operator_group', value: '(' }, { type: 'field', value: 'field' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value' }, { type: 'conjunction', value: ';' }, { type: 'field', value: 'field2' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value2' }, { type: 'operator_group', value: ')' }, { type: 'conjunction', value: ',' }, { type: 'field', value: 'field3' }, { type: 'operator_compare', value: '=' }, { type: 'value', value: 'value3' }]}
  `('Tokenize the input: $input', ({ input, tokens }) => {
    expect(tokenizer({ input })).toEqual(tokens);
  });

  // Get suggestions
  it.each`
    input                       | suggestions
    ${''}                       | ${[]}
    ${'w'}                      | ${[]}
    ${'f'}                      | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }]}
    ${'field'}                  | ${[{ description: 'Field2', label: 'field2', type: 'field' }, { description: 'equality', label: '=', type: 'operator_compare' }, { description: 'not equality', label: '!=', type: 'operator_compare' }, { description: 'bigger', label: '>', type: 'operator_compare' }, { description: 'smaller', label: '<', type: 'operator_compare' }, { description: 'like as', label: '~', type: 'operator_compare' }]}
    ${'field='}                 | ${[{ label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }]}
    ${'field=v'}                | ${[{ description: 'Run the search query', label: 'Search', type: 'function_search' }, { description: 'Current value', label: 'v', type: 'value' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: ';', type: 'conjunction' }, { description: 'or', label: ',', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value'}            | ${[{ description: 'Run the search query', label: 'Search', type: 'function_search' }, { description: 'Current value', label: 'value', type: 'value' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: ';', type: 'conjunction' }, { description: 'or', label: ',', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value;'}           | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }, { description: 'open group', label: '(', type: 'operator_group' }]}
    ${'field=value;field2'}     | ${[{ description: 'equality', label: '=', type: 'operator_compare' }, { description: 'not equality', label: '!=', type: 'operator_compare' }, { description: 'bigger', label: '>', type: 'operator_compare' }, { description: 'smaller', label: '<', type: 'operator_compare' }, { description: 'like as', label: '~', type: 'operator_compare' }]}
    ${'field=value;field2='}    | ${[{ label: '127.0.0.1', type: 'value' }, { label: '127.0.0.2', type: 'value' }, { label: '190.0.0.1', type: 'value' }, { label: '190.0.0.2', type: 'value' }]}
    ${'field=value;field2=127'} | ${[{ description: 'Run the search query', label: 'Search', type: 'function_search' }, { description: 'Current value', label: '127', type: 'value' }, { label: '127.0.0.1', type: 'value' }, { label: '127.0.0.2', type: 'value' }, { description: 'and', label: ';', type: 'conjunction' }, { description: 'or', label: ',', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
  `('Get suggestion from the input: $input', async ({ input, suggestions }) => {
    expect(
      await getSuggestions(tokenizer({ input }), {
        id: 'aql',
        suggestions: {
          field(currentValue) {
            return [
              { label: 'field', description: 'Field' },
              { label: 'field2', description: 'Field2' },
            ].map(({ label, description }) => ({
              type: 'field',
              label,
              description,
            }));
          },
          value(currentValue = '', { previousField }) {
            switch (previousField) {
              case 'field':
                return ['value', 'value2', 'value3', 'value4']
                  .filter(value => value.startsWith(currentValue))
                  .map(value => ({ type: 'value', label: value }));
                break;
              case 'field2':
                return ['127.0.0.1', '127.0.0.2', '190.0.0.1', '190.0.0.2']
                  .filter(value => value.startsWith(currentValue))
                  .map(value => ({ type: 'value', label: value }));
                break;
              default:
                return [];
                break;
            }
          },
        },
      }),
    ).toEqual(suggestions);
  });
});
