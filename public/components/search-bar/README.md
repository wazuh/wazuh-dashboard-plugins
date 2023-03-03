# Component

The `SearchBar` component is a base component of a search bar.

It is designed to be extensible through the self-contained query language implementations. This means
the behavior of the search bar depends on the business logic of each query language. For example, a
query language can display suggestions according to the user input or prepend some buttons to the search bar.

It is based on a custom `EuiSuggest` component defined in `public/components/eui-suggest/suggest.js`. So the
abilities are restricted by this one.

## Features

- Supports multiple query languages.
- Switch the selected query language.
- Self-contained query language implementation and ability to interact with the search bar component.
- React to external changes to set the new input. This enables to change the input from external components.

# Usage

Basic usage:

```tsx
<SearchBar
  // Define the query languages. Required.
  // The ID of them should be registered previously. See How to add a new query language documentation.
  modes={[
    {
      id: 'aql',
      // specific query language parameters
      implicitQuery: 'id!=000;',
      suggestions: {
        field(currentValue) {
          return [
            { label: 'configSum', description: 'Config sum' },
            { label: 'dateAdd', description: 'Date add' },
            { label: 'id', description: 'ID' },
            { label: 'ip', description: 'IP address' },
            { label: 'group', description: 'Group' },
            { label: 'group_config_status', description: 'Synced configuration status' },
            { label: 'lastKeepAline', description: 'Date add' },
            { label: 'manager', description: 'Manager' },
            { label: 'mergedSum', description: 'Merged sum' },
            { label: 'name', description: 'Agent name' },
            { label: 'node_name', description: 'Node name' },
            { label: 'os.platform', description: 'Operating system platform' },
            { label: 'status', description: 'Status' },
            { label: 'version', description: 'Version' },
          ]
          .map(field => ({ type: 'field', ...field }));
        },
        value: async (currentValue, { previousField }) => {
          switch (previousField) {
            case 'configSum':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'dateAdd':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'id':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'ip':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'group':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'group_config_status':
              return [AGENT_SYNCED_STATUS.SYNCED, AGENT_SYNCED_STATUS.NOT_SYNCED].map(
                (status) => ({
                  type: 'value',
                  label: status,
                }),
              );
              break;
            case 'lastKeepAline':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'manager':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'mergedSum':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'name':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'node_name':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'os.platform':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            case 'status':
              return UI_ORDER_AGENT_STATUS.map(
                (status) => ({
                  type: 'value',
                  label: status,
                }),
              );
              break;
            case 'version':
              return await getAgentFilterValuesMapToSearchBarSuggestion(
                previousField,
                currentValue,
                {q: 'id!=000'}
              );
              break;
            default:
              return [];
              break;
          }
        },
      }
    },
  ]}
  // Handler fired when the input handler changes. Optional.
  onChange={onChange}
  // Handler fired when the user press the Enter key or custom implementations. Required.
  onSearch={onSearch}
  // Used to define the internal input. Optional.
  // This could be used to change the input text from the external components.
  input="" 
></SearchBar>
```

# Query languages

The built-in query languages are:

- AQL: API Query Language. Based on https://documentation.wazuh.com/current/user-manual/api/queries.html.

## How to add a new query language

### Definition

The language expects to take the interface:

```ts
type SearchBarQueryLanguage = {
  description: string;
  documentationLink?: string;
  id: string;
  label: string;
  getConfiguration?: () => any;
  run: (input: string | undefined, params: any) => any;
  transformUnifiedQuery: (unifiedQuery) => any;
};
```

where:

- `description`: It is the description of the query language. This is displayed in a query language popover
  on the right side of the search bar. Required.
- `documentationLink`: URL to the documentation link. Optional.
- `id`: identification of the query language.
- `label`: name
- `getConfiguration`: method that returns the configuration of the language. This allows custom behavior.
- `run`: method that returns the properties that will used by the base search bar component and the output used when searching

Create a new file located in `public/components/search-bar/query-language` and define the expected interface;

### Register

Go to `public/components/search-bar/query-language/index.ts` and add the new query language:

```ts
import { AQL } from './aql';

// Import the custom query language
import { CustomQL } from './custom';

// [...]

// Register the query languages
export const searchBarQueryLanguages: {
  [key: string]: SearchBarQueryLanguage;
} = [
  AQL,
  CustomQL, // Add the new custom query language
].reduce((accum, item) => {
  if (accum[item.id]) {
    throw new Error(`Query language with id: ${item.id} already registered.`);
  }
  return {
    ...accum,
    [item.id]: item,
  };
}, {});
```
