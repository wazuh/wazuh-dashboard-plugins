import { getSuggestions, tokenizer, transformSpecificQLToUnifiedQL, HAQL } from './haql';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SearchBar } from '../index';

describe('SearchBar component', () => {
  const componentProps = {
    defaultMode: HAQL.id,
    input: '',
    modes: [
      {
        id: HAQL.id,
        implicitQuery: 'id!=000;',
        suggestions: {
          field(currentValue) {
            return [];
          },
          value(currentValue, { previousField }){
            return [];
          },
        },
      }
    ],
    /* eslint-disable @typescript-eslint/no-empty-function */
    onChange: () => {},
    onSearch: () => {}
    /* eslint-enable @typescript-eslint/no-empty-function */
  };

  it('Renders correctly to match the snapshot of query language', async () => {
    const wrapper = render(
      <SearchBar
        {...componentProps}
      />
    );

    await waitFor(() => {
      const elementImplicitQuery = wrapper.container.querySelector('.euiCodeBlock__code');
      expect(elementImplicitQuery?.innerHTML).toEqual('id!=000 and ');
      expect(wrapper.container).toMatchSnapshot();
    });
  });
});

/* eslint-disable max-len */
describe('Query language - HAQL', () => {
  // Tokenize the input
  function tokenCreator({type, value}){
    return {type, value};
  };

  const t = {
    opGroup: (value = undefined) => tokenCreator({type: 'operator_group', value}),
    opCompare: (value = undefined) => tokenCreator({type: 'operator_compare', value}),
    field: (value = undefined) => tokenCreator({type: 'field', value}),
    value: (value = undefined) => tokenCreator({type: 'value', value}),
    whitespace: (value = undefined) => tokenCreator({type: 'whitespace', value}),
    conjunction: (value = undefined) =>  tokenCreator({type: 'conjunction', value})
  };

  // Token undefined
  const tu = {
    opGroup: tokenCreator({type: 'operator_group', value: undefined}),
    opCompare: tokenCreator({type: 'operator_compare', value: undefined}),
    whitespace: tokenCreator({type: 'whitespace', value: undefined}),
    field: tokenCreator({type: 'field', value: undefined}),
    value: tokenCreator({type: 'value', value: undefined}),
    conjunction: tokenCreator({type: 'conjunction', value: undefined})
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
    tu.whitespace
  ];


  it.each`
  input                        | tokens
  ${''}                        | ${tuBlankSerie}
  ${'f'}                       | ${[tu.opGroup, tu.whitespace, t.field('f'), tu.whitespace, tu.opCompare, tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, tu.opCompare, tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field='}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value and'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), tu.whitespace, ...tuBlankSerie]}
  ${'field=value and '}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), ...tuBlankSerie]}
  ${'field=value and field2'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, tu.opCompare, tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value and field2!='}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, tu.value, tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value and field2!="'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('"'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value and field2!="value'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('"value'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value and field2!="value"'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('"value"'), tu.whitespace, tu.opGroup, tu.whitespace, tu.conjunction, tu.whitespace, ...tuBlankSerie]}
  ${'field=value and field2!=value2 and'}                       | ${[tu.opGroup, tu.whitespace, t.field('field'), tu.whitespace, t.opCompare('='), tu.whitespace, t.value('value'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.field('field2'), tu.whitespace, t.opCompare('!='), tu.whitespace, t.value('value2'), t.whitespace(' '), tu.opGroup, tu.whitespace, t.conjunction('and'), tu.whitespace, ...tuBlankSerie]}
  `(`Tokenizer API input $input`, ({input, tokens}) => {
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
    ${'field=v'}                | ${[{ description: 'Run the search query', label: 'Search', type: 'function_search' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: 'and', type: 'conjunction' }, { description: 'or', label: 'or', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value'}            | ${[{ description: 'Run the search query', label: 'Search', type: 'function_search' }, { label: 'value', type: 'value' }, { label: 'value2', type: 'value' }, { label: 'value3', type: 'value' }, { label: 'value4', type: 'value' }, { description: 'and', label: 'and', type: 'conjunction' }, { description: 'or', label: 'or', type: 'conjunction' }, { description: 'close group', label: ')', type: 'operator_group' }]}
    ${'field=value and'}           | ${[{ description: 'Field', label: 'field', type: 'field' }, { description: 'Field2', label: 'field2', type: 'field' }, { description: 'open group', label: '(', type: 'operator_group' }]}
  `('Get suggestion from the input: $input', async ({ input, suggestions }) => {
    expect(
      await getSuggestions(tokenizer(input), {
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

  // Transform specific query language to UQL (Unified Query Language)
  it.each`
  HAQL                                                    | UQL
  ${'field'}                                              | ${'field'}
  ${'field='}                                             | ${'field='}
  ${'field=value'}                                        | ${'field=value'}
  ${'field=value()'}                                      | ${'field=value()'}
  ${'field="custom value"'}                               | ${'field=custom value'}
  ${'field="custom \\"value"'}                            | ${'field=custom "value'}
  ${'field="custom \\"value\\""'}                         | ${'field=custom "value"'}
  ${'field=value and'}                                    | ${'field=value;'}
  ${'field="custom value" and'}                           | ${'field=custom value;'}
  ${'(field=value'}                                       | ${'(field=value'}
  ${'(field=value)'}                                      | ${'(field=value)'}
  ${'(field=value) and'}                                  | ${'(field=value);'}
  ${'(field=value) and field2'}                           | ${'(field=value);field2'}
  ${'(field=value) and field2>'}                          | ${'(field=value);field2>'}
  ${'(field=value) and field2>"wrappedcommas"'}           | ${'(field=value);field2>wrappedcommas'}
  ${'(field=value) and field2>"value with spaces"'}       | ${'(field=value);field2>value with spaces'}
  ${'field ='}                                            | ${'field='}
  ${'field = value'}                                      | ${'field=value'}
  ${'field = value or'}                                   | ${'field=value,'}
  ${'field = value or field2'}                            | ${'field=value,field2'}
  ${'field = value or field2 <'}                          | ${'field=value,field2<'}
  ${'field = value or field2 < value2'}                   | ${'field=value,field2<value2'}
  ${'( field = value ) and field2 > "custom value" '}     | ${'(field=value);field2>custom value'}
  `('transformSpecificQLToUnifiedQL - HAQL $HAQL', ({HAQL, UQL}) => {
    expect(transformSpecificQLToUnifiedQL(HAQL)).toEqual(UQL);
  });

  // When a suggestion is clicked, change the input text
  it.each`
  HAQL                              | clikedSuggestion                                                            | changedInput
  ${''}                             | ${{type: { iconType: 'kqlField', color: 'tint4' }, label: 'field'}}         | ${'field'}
  ${'field'}                        | ${{type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2'}}        | ${'field2'}
  ${'field'}                        | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '='}}           | ${'field='}
  ${'field='}                       | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value'}}         | ${'field=value'}
  ${'field='}                       | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '!='}}          | ${'field!='}
  ${'field=value'}                  | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2'}}        | ${'field=value2'}
  ${'field=value'}                  | ${{type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'and'}}        | ${'field=value and '}
  ${'field=value and '}             | ${{type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2'}}        | ${'field=value and field2'}
  ${'field=value and field2'}       | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>'}}           | ${'field=value and field2>'}
  ${'field='}                       | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with spaces'}}   | ${'field="with spaces"'}
  ${'field='}                       | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'with "spaces'}}  | ${'field="with \\"spaces"'}
  ${'field='}                       | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: '"value'}}        | ${'field="\\"value"'}
  ${''}                             | ${{type: { iconType: 'tokenDenseVector', color: 'tint3' }, label: '('}}     | ${'('}
  ${'('}                            | ${{type: { iconType: 'kqlField', color: 'tint4' }, label: 'field'}}         | ${'(field'}
  ${'(field'}                       | ${{type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2'}}        | ${'(field2'}
  ${'(field'}                       | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '='}}           | ${'(field='}
  ${'(field='}                      | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value'}}         | ${'(field=value'}
  ${'(field=value'}                 | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2'}}        | ${'(field=value2'}
  ${'(field=value'}                 | ${{type: { iconType: 'kqlSelector', color: 'tint3' }, label: 'or'}}         | ${'(field=value or '}
  ${'(field=value or '}             | ${{type: { iconType: 'kqlField', color: 'tint4' }, label: 'field2'}}        | ${'(field=value or field2'}
  ${'(field=value or field2'}       | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>'}}           | ${'(field=value or field2>'}
  ${'(field=value or field2>'}      | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '>'}}           | ${'(field=value or field2>'}
  ${'(field=value or field2>'}      | ${{type: { iconType: 'kqlOperand', color: 'tint1' }, label: '~'}}           | ${'(field=value or field2~'}
  ${'(field=value or field2>'}      | ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value2'}}        | ${'(field=value or field2>value2'}
  ${'(field=value or field2>value2'}| ${{type: { iconType: 'kqlValue', color: 'tint0' }, label: 'value3'}}        | ${'(field=value or field2>value3'}
  ${'(field=value or field2>value2'}| ${{type: { iconType: 'tokenDenseVector', color: 'tint3' }, label: ')'}}     | ${'(field=value or field2>value2)'}
  `('click suggestion - HAQL $HAQL => $changedInput', async ({HAQL: currentInput, clikedSuggestion, changedInput}) => {
    // Mock input
    let input = currentInput;

    const qlOutput = await HAQL.run(input, {
      setInput: (value: string): void => { input = value; },
      queryLanguage: {
        parameters: {
          implicitQuery: '',
          suggestions: {
            field: () => ([]),
            value: () => ([])
          }
        }
      }
    });
    qlOutput.searchBarProps.onItemClick(clikedSuggestion);
    expect(input).toEqual(changedInput);
  });

  // Transform the external input in UQL (Unified Query Language) to QL
  it.each`
  UQL                                 | HAQL
  ${''}                               | ${''}
  ${'field'}                          | ${'field'}
  ${'field='}                         | ${'field='}
  ${'field!='}                        | ${'field!='}
  ${'field>'}                         | ${'field>'}
  ${'field<'}                         | ${'field<'}
  ${'field~'}                         | ${'field~'}
  ${'field=value'}                    | ${'field=value'}
  ${'field=value;'}                   | ${'field=value and '}
  ${'field=value;field2'}             | ${'field=value and field2'}
  ${'field="'}                        | ${'field="\\""'}
  ${'field=with spaces'}              | ${'field="with spaces"'}
  ${'field=with "spaces'}             | ${'field="with \\"spaces"'}
  ${'('}                              | ${'('}
  ${'(field'}                         | ${'(field'}
  ${'(field='}                        | ${'(field='}
  ${'(field=value'}                   | ${'(field=value'}
  ${'(field=value,'}                  | ${'(field=value or '}
  ${'(field=value,field2'}            | ${'(field=value or field2'}
  ${'(field=value,field2>'}           | ${'(field=value or field2>'}
  ${'(field=value,field2>value2'}     | ${'(field=value or field2>value2'}
  ${'(field=value,field2>value2)'}     | ${'(field=value or field2>value2)'}
  `('Transform the external input UQL to QL - UQL $UQL => $HAQL', async ({UQL, HAQL: changedInput}) => {
    expect(HAQL.transformUnifiedQuery(UQL)).toEqual(changedInput);
  });

});
