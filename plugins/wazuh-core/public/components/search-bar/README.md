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
      id: 'wql',
      // specific query language parameters
      options: {
        // implicit query. Optional
        // Set a implicit query that can't be changed by the user.
        // Use the UQL (Unified Query Language) syntax.
        implicitQuery: {
          query: 'id!=000',
          conjunction: ';',
        },
        searchTermFields: ['id', 'ip'],
      },
      suggestions: {
        field(currentValue) {
          return [
            { label: 'configSum', description: 'Config sum' },
            { label: 'dateAdd', description: 'Date add' },
            { label: 'id', description: 'ID' },
            { label: 'ip', description: 'IP address' },
            { label: 'group', description: 'Group' },
            {
              label: 'group_config_status',
              description: 'Synced configuration status',
            },
            { label: 'lastKeepAline', description: 'Date add' },
            { label: 'manager', description: 'Manager' },
            { label: 'mergedSum', description: 'Merged sum' },
            { label: 'name', description: 'Agent name' },
            { label: 'node_name', description: 'Node name' },
            { label: 'os.platform', description: 'Operating system platform' },
            { label: 'status', description: 'Status' },
            { label: 'version', description: 'Version' },
          ];
        },
        value: async (currentValue, { field }) => {
          switch (field) {
            case 'configSum':
              return [{ label: 'configSum1' }, { label: 'configSum2' }];
              break;
            case 'dateAdd':
              return [{ label: 'dateAdd1' }, { label: 'dateAdd2' }];
              break;
            case 'status':
              return UI_ORDER_AGENT_STATUS.map(status => ({
                label: status,
              }));
              break;
            default:
              return [];
              break;
          }
        },
      },
    },
  ]}
  // Handler fired when the input handler changes. Optional.
  onChange={onChange}
  // Handler fired when the user press the Enter key or custom implementations. Required.
  onSearch={onSearch}
  // Used to define the internal input. Optional.
  // This could be used to change the input text from the external components.
  // Use the UQL (Unified Query Language) syntax.
  input=''
  // Define the default mode. Optional. If not defined, it will use the first one mode.
  defaultMode=''
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
  run: (
    input: string | undefined,
    params: any,
  ) => Promise<{
    searchBarProps: any;
    output: {
      language: string;
      apiQuery: string;
      query: string;
    };
  }>;
  transformInput: (
    unifiedQuery: string,
    options: { configuration: any; parameters: any },
  ) => string;
};
```

where:

- `description`: is the description of the query language. This is displayed in a query language popover
  on the right side of the search bar. Required.
- `documentationLink`: URL to the documentation link. Optional.
- `id`: identification of the query language.
- `label`: name
- `getConfiguration`: method that returns the configuration of the language. This allows custom behavior.
- `run`: method that returns:
  - `searchBarProps`: properties to be passed to the search bar component. This allows the
    customization the properties that will used by the base search bar component and the output used when searching
  - `output`:
    - `language`: query language ID
    - `apiQuery`: API query.
    - `query`: current query in the specified language
- `transformInput`: method that transforms the UQL (Unified Query Language) to the specific query
  language. This is used when receives a external input in the Unified Query Language, the returned
  value is converted to the specific query language to set the new input text of the search bar
  component.

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

## Unified Query Language - UQL

This is an unified syntax used by the search bar component that provides a way to communicate
with the different query language implementations.

The input and output parameters of the search bar component must use this syntax.

This is used in:

- input:
  - `input` component property
- output:
  - `onChange` component handler
  - `onSearch` component handler

Its syntax is equal to Wazuh API Query Language
https://wazuh.com/<major_version>.<minor_version>/user-manual/api/queries.html

> The AQL query language is a implementation of this syntax.
