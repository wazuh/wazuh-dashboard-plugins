/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SearchBar } from '../index';
import {
  getSuggestions,
  tokenizer,
  transformSpecificQLToUnifiedQL,
  WQL,
} from './wql';

describe('SearchBar component', () => {
  const componentProps = {
    defaultMode: WQL.id,
    input: '',
    modes: [
      {
        id: WQL.id,
        options: {
          implicitQuery: {
            query: 'id!=000',
            conjunction: ';',
          },
        },
        suggestions: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          field(currentValue) {
            return [];
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          value(currentValue, { field }) {
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
      expect(wrapper.container).toMatchSnapshot();
    });
  });
});

// Tokenize the input
function tokenCreator({ type, value, formattedValue }) {
  return { type, value, ...(formattedValue ? { formattedValue } : {}) };
}

/* eslint-disable max-len */
describe('Query language - WQL', () => {
  const t = {
    opGroup: (value?) => tokenCreator({ type: 'operator_group', value }),
    opCompare: (value?) => tokenCreator({ type: 'operator_compare', value }),
    field: (value?) => tokenCreator({ type: 'field', value }),
    value: (value?, formattedValue?) =>
      tokenCreator({
        type: 'value',
        value,
        formattedValue: formattedValue ?? value,
      }),
    whitespace: (value?) => tokenCreator({ type: 'whitespace', value }),
    conjunction: (value?) => tokenCreator({ type: 'conjunction', value }),
  };
  // Token undefined
  const tu = {
    opGroup: tokenCreator({ type: 'operator_group', value: undefined }),
    opCompare: tokenCreator({ type: 'operator_compare', value: undefined }),
    whitespace: tokenCreator({ type: 'whitespace', value: undefined }),
    field: tokenCreator({ type: 'field', value: undefined }),
    value: tokenCreator({
      type: 'value',
      value: undefined,
      formattedValue: undefined,
    }),
    conjunction: tokenCreator({ type: 'conjunction', value: undefined }),
  };
  const tuBlankSerie = [
    tu.opGroup,
    tu.whitespace,
    tu.field,
    tu.whitespace,
    tu.opCompare,
    tu.whitespace,
    tu.value,
    tu.whitespace,
    tu.opGroup,
    tu.whitespace,
    tu.conjunction,
    tu.whitespace,
  ];

  it.each`
    input                                   | tokens
    ${''}                                   | ${tuBlankSerie}
    ${'f'}                                  | ${[tu.opGroup, tu.whitespace, t.field('f'), tu.whitespace, tu.opCompare, tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field'}                              | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, tu.opCompare, tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field='}                             | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value'}                        | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=and'}                          | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('and'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=or'}                           | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('or'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=valueand'}                     | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('valueand'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=valueor'}                      | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('valueor'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value='}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value='), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value!='}                      | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value!='), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value>'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value>'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value<'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value<'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value~'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value~'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie] /** ~ character is not supported as value in the q query parameter */}
    ${'field="'}                            | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value and'}                   | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value and'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value and value2"'}           | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value and value2"', 'value and value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value or value2"'}            | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value or value2"', 'value or value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value = value2"'}             | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value = value2"', 'value = value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value != value2"'}            | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value != value2"', 'value != value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value > value2"'}             | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value > value2"', 'value > value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value < value2"'}             | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value < value2"', 'value < value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field="value ~ value2"'}             | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('"value ~ value2"', 'value ~ value2'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie] /** ~ character is not supported as value in the q query parameter */}
    ${'field=value and'}                    | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), tu.whitespace, ...tuBlankSerie]}
    ${'field=value and '}                   | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), ...tuBlankSerie]}
    ${'field=value and field2'}             | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, tu.opCompare, tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value and field2!='}           | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value and field2!="'}          | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('"'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value and field2!="value'}     | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('"value'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value and field2!="value"'}    | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('"value"', 'value'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
    ${'field=value and field2!=value2 and'} | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('value2'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), tu.whitespace, ...tuBlankSerie]}
  `(`Tokenizer API input $input`, ({ input, tokens }) => {
    expect(tokenizer(input)).toEqual(tokens);
  });

  // Get suggestions
  it.each`
    input                | suggestions
    ${''}                | ${[{ description: 'run the search query', label: 'Search', type: 'function_search' }, { description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }, { description: 'open group', label: '(', type: 'operator_group' }]}
    ${'w'}               | ${[]}
    ${'f'}               | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }]}
    ${'field'}           | ${[{ description: 'Field2', label: 'field2', type: 'field' }, { description: 'equality', label: '=', type: 'operator_compare' }, { description: 'not equality', label: '!=', type: 'operator_compare' }, { description: 'bigger', label: '>', type: 'operator_compare' }, { description: 'smaller', label: '<', type: 'operator_compare' }, { description: 'like as', label: '~', type: 'operator_compare' }]}
    ${'field='}          | ${[{ label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }]}
    ${'field=v'}         | ${[{ description: 'run the search query', label: 'Search', type: 'function_search' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: 'and', type: 'conjunction' }, { description: 'or', label: 'or', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value'}     | ${[{ description: 'run the search query', label: 'Search', type: 'function_search' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: 'and', type: 'conjunction' }, { description: 'or', label: 'or', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value and'} | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }, { description: 'open group', label: '(', type: 'operator_group' }]}
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
            ].map(({ label, description }) => ({
              type: 'field',
              label,
              description,
            }));
          },
          value(currentValue = '', { field }) {
            switch (field) {
              case 'field': {
                return ['value', 'value2', 'value3', 'value4']
                  .filter(value => value.startsWith(currentValue))
                  .map(value => ({ type: 'value', label: value }));
              }

              case 'field2': {
                return ['127.0.0.1', '127.0.0.2', '190.0.0.1', '190.0.0.2']
                  .filter(value => value.startsWith(currentValue))
                  .map(value => ({ type: 'value', label: value }));
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

  // Transform specific query language to UQL (Unified Query Language)
  it.each`
    WQL                                                 | UQL
    ${'field'}                                          | ${'field'}
    ${'field='}                                         | ${'field='}
    ${'field=value'}                                    | ${'field=value'}
    ${'field=value()'}                                  | ${'field=value()'}
    ${'field=valueand'}                                 | ${'field=valueand'}
    ${'field=valueor'}                                  | ${'field=valueor'}
    ${'field=value='}                                   | ${'field=value='}
    ${'field=value!='}                                  | ${'field=value!='}
    ${'field=value>'}                                   | ${'field=value>'}
    ${'field=value<'}                                   | ${'field=value<'}
    ${'field=value~'}                                   | ${'field=value~' /** ~ character is not supported as value in the q query parameter */}
    ${'field="custom value"'}                           | ${'field=custom value'}
    ${'field="custom value()"'}                         | ${'field=custom value()'}
    ${'field="value and value2"'}                       | ${'field=value and value2'}
    ${'field="value or value2"'}                        | ${'field=value or value2'}
    ${'field="value = value2"'}                         | ${'field=value = value2'}
    ${'field="value != value2"'}                        | ${'field=value != value2'}
    ${'field="value > value2"'}                         | ${'field=value > value2'}
    ${'field="value < value2"'}                         | ${'field=value < value2'}
    ${'field="value ~ value2"'}                         | ${'field=value ~ value2' /** ~ character is not supported as value in the q query parameter */}
    ${String.raw`field="custom \"value"`}               | ${'field=custom "value'}
    ${String.raw`field="custom \"value\""`}             | ${'field=custom "value"'}
    ${'field=value and'}                                | ${'field=value;'}
    ${'field="custom value" and'}                       | ${'field=custom value;'}
    ${'(field=value'}                                   | ${'(field=value'}
    ${'(field=value)'}                                  | ${'(field=value)'}
    ${'(field=value) and'}                              | ${'(field=value);'}
    ${'(field=value) and field2'}                       | ${'(field=value);field2'}
    ${'(field=value) and field2>'}                      | ${'(field=value);field2>'}
    ${'(field=value) and field2>"wrappedcommas"'}       | ${'(field=value);field2>wrappedcommas'}
    ${'(field=value) and field2>"value with spaces"'}   | ${'(field=value);field2>value with spaces'}
    ${'field ='}                                        | ${'field='}
    ${'field = value'}                                  | ${'field=value'}
    ${'field = value()'}                                | ${'field=value()'}
    ${'field = valueand'}                               | ${'field=valueand'}
    ${'field = valueor'}                                | ${'field=valueor'}
    ${'field = value='}                                 | ${'field=value='}
    ${'field = value!='}                                | ${'field=value!='}
    ${'field = value>'}                                 | ${'field=value>'}
    ${'field = value<'}                                 | ${'field=value<'}
    ${'field = value~'}                                 | ${'field=value~' /** ~ character is not supported as value in the q query parameter */}
    ${'field = "custom value"'}                         | ${'field=custom value'}
    ${'field = "custom value()"'}                       | ${'field=custom value()'}
    ${'field = "value and value2"'}                     | ${'field=value and value2'}
    ${'field = "value or value2"'}                      | ${'field=value or value2'}
    ${'field = "value = value2"'}                       | ${'field=value = value2'}
    ${'field = "value != value2"'}                      | ${'field=value != value2'}
    ${'field = "value > value2"'}                       | ${'field=value > value2'}
    ${'field = "value < value2"'}                       | ${'field=value < value2'}
    ${'field = "value ~ value2"'}                       | ${'field=value ~ value2' /** ~ character is not supported as value in the q query parameter */}
    ${'field = value or'}                               | ${'field=value,'}
    ${'field = value or field2'}                        | ${'field=value,field2'}
    ${'field = value or field2 <'}                      | ${'field=value,field2<'}
    ${'field = value or field2 < value2'}               | ${'field=value,field2<value2'}
    ${'( field = value ) and field2 > "custom value" '} | ${'(field=value);field2>custom value'}
  `('transformSpecificQLToUnifiedQL - WQL $WQL TO UQL $UQL', ({ WQL, UQL }) => {
    expect(transformSpecificQLToUnifiedQL(WQL)).toEqual(UQL);
  });

  // When a suggestion is clicked, change the input text
  it.each`
    WQL                                | clikedSuggestion                                                               | changedInput
    ${''}                              | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field' }}          | ${'field'}
    ${'field'}                         | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}         | ${'field2'}
    ${'field'}                         | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '=' }}            | ${'field='}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value' }}          | ${'field=value'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value()' }}        | ${'field=value()'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'valueand' }}       | ${'field=valueand'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'valueor' }}        | ${'field=valueor'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value=' }}         | ${'field=value='}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value!=' }}        | ${'field=value!='}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value>' }}         | ${'field=value>'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value<' }}         | ${'field=value<'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value~' }}         | ${'field=value~' /** ~ character is not supported as value in the q query parameter */}
    ${'field='}                        | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '!=' }}           | ${'field!='}
    ${'field=value'}                   | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2' }}         | ${'field=value2'}
    ${'field=value'}                   | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'and' }}         | ${'field=value and '}
    ${'field=value and'}               | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'or' }}          | ${'field=value or'}
    ${'field=value and'}               | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}         | ${'field=value and field2'}
    ${'field=value and '}              | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'or' }}          | ${'field=value or '}
    ${'field=value and '}              | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}         | ${'field=value and field2'}
    ${'field=value and field2'}        | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>' }}            | ${'field=value and field2>'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with spaces' }}    | ${'field="with spaces"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with "spaces' }}   | ${String.raw`field="with \"spaces"`}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with value()' }}   | ${'field="with value()"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with and value' }} | ${'field="with and value"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with or value' }}  | ${'field="with or value"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with = value' }}   | ${'field="with = value"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with != value' }}  | ${'field="with != value"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with > value' }}   | ${'field="with > value"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with < value' }}   | ${'field="with < value"'}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with ~ value' }}   | ${'field="with ~ value"' /** ~ character is not supported as value in the q query parameter */}
    ${'field='}                        | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: '"value' }}         | ${String.raw`field="\"value"`}
    ${'field="with spaces"'}           | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value' }}          | ${'field=value'}
    ${'field="with spaces"'}           | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'other spaces' }}   | ${'field="other spaces"'}
    ${''}                              | ${{ type: { iconType: 'tokenDenseVector', color: 'tint3' }, label: '(' }}      | ${'('}
    ${'('}                             | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field' }}          | ${'(field'}
    ${'(field'}                        | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}         | ${'(field2'}
    ${'(field'}                        | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '=' }}            | ${'(field='}
    ${'(field='}                       | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value' }}          | ${'(field=value'}
    ${'(field=value'}                  | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2' }}         | ${'(field=value2'}
    ${'(field=value'}                  | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'or' }}          | ${'(field=value or '}
    ${'(field=value or'}               | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'and' }}         | ${'(field=value and'}
    ${'(field=value or'}               | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}         | ${'(field=value or field2'}
    ${'(field=value or '}              | ${{ type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'and' }}         | ${'(field=value and '}
    ${'(field=value or '}              | ${{ type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2' }}         | ${'(field=value or field2'}
    ${'(field=value or field2'}        | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>' }}            | ${'(field=value or field2>'}
    ${'(field=value or field2>'}       | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>' }}            | ${'(field=value or field2>'}
    ${'(field=value or field2>'}       | ${{ type: { iconType: 'kqlOperand', color: 'tint1' }, label: '~' }}            | ${'(field=value or field2~'}
    ${'(field=value or field2>'}       | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2' }}         | ${'(field=value or field2>value2'}
    ${'(field=value or field2>value2'} | ${{ type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value3' }}         | ${'(field=value or field2>value3'}
    ${'(field=value or field2>value2'} | ${{ type: { iconType: 'tokenDenseVector', color: 'tint3' }, label: ')' }}      | ${'(field=value or field2>value2 )'}
  `(
    'click suggestion - WQL "$WQL" => "$changedInput"',
    async ({ WQL: currentInput, clikedSuggestion, changedInput }) => {
      // Mock input
      let input = currentInput;
      const qlOutput = await WQL.run(input, {
        setInput: (value: string): void => {
          input = value;
        },
        queryLanguage: {
          parameters: {
            options: {},
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
    UQL                              | WQL
    ${''}                            | ${''}
    ${'field'}                       | ${'field'}
    ${'field='}                      | ${'field='}
    ${'field=()'}                    | ${'field=()'}
    ${'field=valueand'}              | ${'field=valueand'}
    ${'field=valueor'}               | ${'field=valueor'}
    ${'field=value='}                | ${'field=value='}
    ${'field=value!='}               | ${'field=value!='}
    ${'field=value>'}                | ${'field=value>'}
    ${'field=value<'}                | ${'field=value<'}
    ${'field=value~'}                | ${'field=value~'}
    ${'field!='}                     | ${'field!='}
    ${'field>'}                      | ${'field>'}
    ${'field<'}                      | ${'field<'}
    ${'field~'}                      | ${'field~'}
    ${'field=value'}                 | ${'field=value'}
    ${'field=value;'}                | ${'field=value and '}
    ${'field=value;field2'}          | ${'field=value and field2'}
    ${'field="'}                     | ${String.raw`field="\""`}
    ${'field=with spaces'}           | ${'field="with spaces"'}
    ${'field=with "spaces'}          | ${String.raw`field="with \"spaces"`}
    ${'field=value ()'}              | ${'field="value ()"'}
    ${'field=with and value'}        | ${'field="with and value"'}
    ${'field=with or value'}         | ${'field="with or value"'}
    ${'field=with = value'}          | ${'field="with = value"'}
    ${'field=with > value'}          | ${'field="with > value"'}
    ${'field=with < value'}          | ${'field="with < value"'}
    ${'('}                           | ${'('}
    ${'(field'}                      | ${'(field'}
    ${'(field='}                     | ${'(field='}
    ${'(field=value'}                | ${'(field=value'}
    ${'(field=value,'}               | ${'(field=value or '}
    ${'(field=value,field2'}         | ${'(field=value or field2'}
    ${'(field=value,field2>'}        | ${'(field=value or field2>'}
    ${'(field=value,field2>value2'}  | ${'(field=value or field2>value2'}
    ${'(field=value,field2>value2)'} | ${'(field=value or field2>value2)'}
    ${'implicit=value;'}             | ${''}
    ${'implicit=value;field'}        | ${'field'}
  `(
    'Transform the external input UQL to QL - UQL $UQL => $WQL',
    async ({ UQL, WQL: changedInput }) => {
      expect(
        WQL.transformInput(UQL, {
          parameters: {
            options: {
              implicitQuery: {
                query: 'implicit=value',
                conjunction: ';',
              },
            },
          },
        }),
      ).toEqual(changedInput);
    },
  );

  /* The ! and ~ characters can't be part of a value that contains examples. The tests doesn't
  include these cases.

  Value examples:
  - with != value
  - with ~ value
  */

  // Validate the tokens
  // Some examples of value tokens are based on this API test: https://github.com/wazuh/wazuh/blob/813595cf58d753c1066c3e7c2018dbb4708df088/framework/wazuh/core/tests/test_utils.py#L987-L1050
  it.each`
    WQL                                                       | validationError
    ${''}                                                     | ${undefined}
    ${'field1'}                                               | ${undefined}
    ${'field2'}                                               | ${undefined}
    ${'field1='}                                              | ${['The value for field "field1" is missing.']}
    ${'field2='}                                              | ${['The value for field "field2" is missing.']}
    ${'field='}                                               | ${['"field" is not a valid field.']}
    ${'custom='}                                              | ${['"custom" is not a valid field.']}
    ${'field1=value'}                                         | ${undefined}
    ${'field_not_number=1'}                                   | ${['Numbers are not valid for field_not_number']}
    ${'field_not_number=value1'}                              | ${['Numbers are not valid for field_not_number']}
    ${'field2=value'}                                         | ${undefined}
    ${'field=value'}                                          | ${['"field" is not a valid field.']}
    ${'custom=value'}                                         | ${['"custom" is not a valid field.']}
    ${'field1=value!test'}                                    | ${['"value!test" is not a valid value. Invalid characters found: !']}
    ${'field1=value&test'}                                    | ${['"value&test" is not a valid value. Invalid characters found: &']}
    ${'field1=value!value&test'}                              | ${['"value!value&test" is not a valid value. Invalid characters found: !&']}
    ${'field1=value!value!test'}                              | ${['"value!value!test" is not a valid value. Invalid characters found: !']}
    ${'field1=value!value!t$&st'}                             | ${['"value!value!t$&st" is not a valid value. Invalid characters found: !$&']}
    ${'field1=value,'}                                        | ${['"value," is not a valid value.']}
    ${'field1="Mozilla Firefox 53.0 (x64 en-US)"'}            | ${undefined}
    ${String.raw`field1="[\"https://example-link@<>=,%?\"]"`} | ${undefined}
    ${'field1=value and'}                                     | ${['There is no whitespace after conjunction "and".', 'There is no sentence after conjunction "and".']}
    ${'field2=value and'}                                     | ${['There is no whitespace after conjunction "and".', 'There is no sentence after conjunction "and".']}
    ${'field=value and'}                                      | ${['"field" is not a valid field.', 'There is no whitespace after conjunction "and".', 'There is no sentence after conjunction "and".']}
    ${'custom=value and'}                                     | ${['"custom" is not a valid field.', 'There is no whitespace after conjunction "and".', 'There is no sentence after conjunction "and".']}
    ${'field1=value and '}                                    | ${['There is no sentence after conjunction "and".']}
    ${'field2=value and '}                                    | ${['There is no sentence after conjunction "and".']}
    ${'field=value and '}                                     | ${['"field" is not a valid field.', 'There is no sentence after conjunction "and".']}
    ${'custom=value and '}                                    | ${['"custom" is not a valid field.', 'There is no sentence after conjunction "and".']}
    ${'field1=value and field2'}                              | ${['The operator for field "field2" is missing.']}
    ${'field2=value and field1'}                              | ${['The operator for field "field1" is missing.']}
    ${'field1=value and field'}                               | ${['"field" is not a valid field.']}
    ${'field2=value and field'}                               | ${['"field" is not a valid field.']}
    ${'field=value and custom'}                               | ${['"field" is not a valid field.', '"custom" is not a valid field.']}
    ${'('}                                                    | ${undefined}
    ${'(field'}                                               | ${undefined}
    ${'(field='}                                              | ${['"field" is not a valid field.']}
    ${'(field=value'}                                         | ${['"field" is not a valid field.']}
    ${'(field=value or'}                                      | ${['"field" is not a valid field.', 'There is no whitespace after conjunction "or".', 'There is no sentence after conjunction "or".']}
    ${'(field=value or '}                                     | ${['"field" is not a valid field.', 'There is no sentence after conjunction "or".']}
    ${'(field=value or field2'}                               | ${['"field" is not a valid field.', 'The operator for field "field2" is missing.']}
    ${'(field=value or field2>'}                              | ${['"field" is not a valid field.', 'The value for field "field2" is missing.']}
    ${'(field=value or field2>value2'}                        | ${['"field" is not a valid field.']}
  `(
    'validate the tokens - WQL $WQL => $validationError',
    async ({ WQL: currentInput, validationError }) => {
      const qlOutput = await WQL.run(currentInput, {
        queryLanguage: {
          parameters: {
            options: {},
            suggestions: {
              field: () =>
                ['field1', 'field2', 'field_not_number'].map(label => ({
                  label,
                })),
              value: () => [],
            },
            validate: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              value: (token, { field, operator_compare }) => {
                if (field === 'field_not_number') {
                  const value = token.formattedValue || token.value;

                  return /\d/.test(value)
                    ? `Numbers are not valid for ${field}`
                    : undefined;
                }
              },
            },
          },
        },
      });

      expect(qlOutput.output.error).toEqual(validationError);
    },
  );
});
