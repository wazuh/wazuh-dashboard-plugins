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
- Self-contained query language implementation and ability to interact with the search bar component
- React to external changes to set the new input. This enables to change the input from external components.

# Usage

Basic usage:

```tsx
<SearchBar
  // Define the query languages.
  // The ID of them should be registered previously. See How to add a new query language documentation.
  modes={[
    {
      id: 'aql',
      // specific query language parameters
    },
  ]}
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
