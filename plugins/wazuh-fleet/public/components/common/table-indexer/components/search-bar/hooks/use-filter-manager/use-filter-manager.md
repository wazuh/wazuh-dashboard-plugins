# useFilterManager Hook Documentation
## Description
The useFilterManager hook provides an interface for managing filters in the Wazuh Fleet application. It allows access to the OpenSearch Dashboards filter manager, retrieving current filters and applying new ones.

## Installation
No additional installation is required, as this hook is part of the Wazuh Fleet project.

## Use

```typescript
import { useFilterManager, FILTER_OPERATOR } from '../hooks/use-filter-manager';

const MyComponent = () => {
  const { filters, addFilters, generateFilter } = useFilterManager();
  
  const handleAddFilter = () => {
    const newFilter = generateFilter({
      type: FILTER_OPERATOR.IS,
      key: 'agent.name',
      value: 'my-agent',
      indexPatternId: 'wazuh-agents'
    });
    
    addFilters([newFilter]);
  };
  
  return (
    // component UI
  );
};
```

## API
### Return of the Hook
| Property | Type | Description |
|----------|------|-------------|
| filterManager | FilterManager | Instance of the OpenSearch Dashboards filter manager |
| filters | Filter[] | Array with current filters |
| addFilters | (filters: Filter[]) => void | Function to add new filters |
| generateFilter | (params: GenerateFilterParams) => Filter | Function to generate a filter based on parameters |

### Types 

## GenerateFilterParams 

``` typescript
interface GenerateFilterParams {
  /** Tipo de operador de filtro */
  type: FILTER_OPERATOR;
  /** Nombre del campo sobre el que se aplicará el filtro */
  key: string;
  /** Valor o valores para el filtro (string, array de strings, o array de números para rangos) */
  value: string | string[] | any;
  /** ID del patrón de índice al que pertenece el campo */
  indexPatternId: string;
  /** Identificador opcional del componente que controla este filtro */
  controlledBy?: string;
}
```

## FILTER_OPERATOR

```typescript
enum FILTER_OPERATOR {
  IS = 'is',
  IS_NOT = 'is not',
  EXISTS = 'exists',
  DOES_NOT_EXISTS = 'does not exists',
  IS_ONE_OF = 'is one of',
  IS_NOT_ONE_OF = 'is not one of',
  IS_BETWEEN = 'is between',
  IS_NOT_BETWEEN = 'is not between',
}
```

## Examples
### Simple filter (IS)
```typescript
const agentNameFilter = generateFilter({
  type: FILTER_OPERATOR.IS,
  key: 'agent.name',
  value: 'windows-agent',
  indexPatternId: 'wazuh-agents'
});

addFilters([agentNameFilter]);
```

### Existence filter (EXISTS)
``` typescript
const fieldExistsFilter = generateFilter({
  type: FILTER_OPERATOR.EXISTS,
  key: 'agent.ip',
  value: null, // No value required for stock filters
  indexPatternId: 'wazuh-agents'
});

addFilters([fieldExistsFilter]);
```

### Multi-value filter (IS_ONE_OF)
```typescript
const multiValueFilter = generateFilter({
  type: FILTER_OPERATOR.IS_ONE_OF,
  key: 'agent.version',
  value: ['4.3.0', '4.3.1', '4.3.2'],
  indexPatternId: 'wazuh-agents'
});

addFilters([multiValueFilter]);
 ```

### Range filter (IS_BETWEEN)
```typescript
const rangeFilter = generateFilter({
  type: FILTER_OPERATOR.IS_BETWEEN,
  key: 'timestamp',
  value: [1609459200000, 1612137600000], // January 1, 2021 - February 1, 2021
  indexPatternId: 'wazuh-agents'
});

addFilters([rangeFilter]);
 ```


## Notes
- Filters are stored in the application state (APP_STATE)
- Changes to filters are automatically reflected in the hook state
- It is recommended to use the generateFilter function to create filters with the correct structure