import { getSuggestions, tokenizer, transformSpecificQLToUnifiedQL } from './haql';

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
  })
});
