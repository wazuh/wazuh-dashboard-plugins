# Query Manager Service

## Overview

The Query Manager Service is a utility designed to facilitate and optimize data retrieval from Elasticsearch index patterns. It provides an interface for creating search contexts, managing filters, and executing queries.

## Key Features

- **Index Pattern Caching**: Stores commonly used index patterns in memory to reduce redundant requests and improve performance
- **Search Context Creation**: Generates context-specific search environments for executing queries
- **Filter Management**: Supports both fixed (persistent) and user (temporary) filters

## Scope

The Query Manager Service provides the following capabilities:

- **Default Index Pattern Management**:

  - Configure default index patterns by ID during instantiation
  - Load and cache index patterns to optimize performance
  - Avoid redundant requests for previously loaded index patterns

- **Search Context Operations**:

  - Create search contexts targeting specific index patterns
  - Associate a context ID with each search context for better organization
  - Access cached index patterns or fetch new ones when needed
  - Execute search queries against the target index pattern

- **Filter Handling**:

  - Define fixed (persistent) filters at search context creation
  - Add/update user (temporary) filters to existing search contexts
  - Combine fixed and user filters for query execution
  - Retrieve filters by type (fixed, user) or get all combined filters

- **Query Execution**:
  - Build and execute Elasticsearch queries with proper filtering
  - Return structured search results
  - Handle query execution errors

## Architecture

The Query Manager Service follows a factory pattern where:

1. A central factory creates instances of the service
2. Each service instance is configured with specific index patterns
3. The service creates search contexts that target specific index patterns
4. Search contexts manage filters and execute queries

### Domain Model

```mermaid
classDiagram
    class IQueryManagerFactory {
        +create(config: QueryManagerFactoryConfig): Promise~IQueryManagerService~
    }

    class QueryManagerService {
        -indexPatterns: IndexPattern[]
        -defaultIndexPatternsIds: string[]
        -dataService: DataService
        -indexPatternRepository: IIndexPatternRepository
        +constructor(config: IQueryManagerConfig)
        +init(): Promise~void~
        +createSearchContext(config: TQueyManagerCreateSearchContextConfig): Promise~ISearchContext~
        -getIndexPatternById(id: string): Promise~IndexPattern~
    }

    class SearchContext {
        -indexPattern: IndexPattern
        -searchService: DataService['search']
        -fixedFilters: TFilter[]
        -userFilters: TFilter[]
        -contextId: string
        +constructor(config: ISearchContextConfig)
        +executeQuery(): Promise~SearchResponse~
        +refreshQuery(): Promise~SearchResponse~
        +setUserFilters(filters: TFilter[]): void
        +clearUserFilters(): void
        +getUserFilters(): TFilter[]
        +setFixedFilters(filters: TFilter[]): void
        +clearFixedFilters(): void
        +getFixedFilters(): TFilter[]
        +getAllFilters(): TFilter[]
    }

    class IIndexPatternRepository {
        +get(id: string): Promise~IndexPattern~
        +getAll(): Promise~IndexPattern[]~
    }

    class DataService {
        +search: object
        +indexPatterns: object
    }

    class IndexPattern {
        +id: string
        +title: string
    }

    class TFilter {
        // Filter properties
    }

    class ISearchParams {
        +filters?: TFilter[]
        +query?: any
        +pagination?: object
        +fields?: string[]
        +sorting?: object
        +dateRange?: object
        +aggs?: any
    }

    class FiltersService {
        +createFilter(operator, field, value, indexPatternId): TFilter
    }

    %% Interfaces and their implementations
    IQueryManagerService <|.. QueryManagerService : implements
    ISearchContext <|.. SearchContext : implements
    IFilterManagerService <|.. SearchContext : implements
    IQueryService <|.. SearchContext : implements

    %% Component relationships
    IQueryManagerFactory --> QueryManagerService : creates
    QueryManagerService --> SearchContext : creates
    QueryManagerService --> IIndexPatternRepository : uses
    QueryManagerService --> DataService : uses
    QueryManagerService --> IndexPattern : manages
    SearchContext --> IndexPattern : references
    SearchContext --> TFilter : manages
    SearchContext --> DataService : uses for search
    FiltersService --> TFilter : creates

    %% Configuration relationships
    IQueryManagerConfig --> QueryManagerService : configures
    ISearchContextConfig --> SearchContext : configures
    TQueyManagerCreateSearchContextConfig --> QueryManagerService : input for createSearchContext
```

El diagrama muestra la separación clara de responsabilidades entre las diferentes clases del sistema:

## Usage Examples

### 1. Creating a Query Manager Factory

The Query Manager Factory is typically exposed by a core plugin:

```typescript
export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): Promise<WazuhCorePluginStart> {
    this.services.queryManagerFactory = new QueryManagerFactory(plugins.data);
    return {
      queryManagerFactory,
    };
  }
}
```

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant Plugin as WazuhCorePlugin
    participant Factory as QueryManagerFactory
    participant DataService as plugins.data

    Plugin->>Factory: new QueryManagerFactory(plugins.data)
    Factory-->>Plugin: queryManagerFactory instance
    Plugin->>Client: return { queryManagerFactory }
```

### 2. Creating Query Manager Service Instances

Create service instances with predefined index patterns:

```typescript
const queryManagerFactory = plugins.wazuhCore.queryManagerFactory;

const fleetQueryManager = await queryManagerFactory.create({
  indexPatterns: [
    { id: 'wazuh-agents*' },
    { id: 'wazuh-states-vulnerabilities*' },
  ],
});
```

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant Client
    participant Factory as QueryManagerFactory
    participant Service as QueryManagerService
    participant Repository as IndexPatternRepository

    Client->>Factory: create({ indexPatterns: [...] })
    Factory->>Service: new QueryManagerService({ indexPatterns, dataService, patternsRepository })
    Service->>Service: validate configuration
    Service->>Service: extract index pattern IDs
    Service->>Service: init()
    Service->>Repository: get(indexPatternId)
    Repository-->>Service: IndexPattern
    Service-->>Factory: QueryManagerService instance
    Factory-->>Client: QueryManagerService instance
```

### 3. Creating Search Contexts

Create a search context to target a specific index pattern:

```typescript
const searchContext = await queryManagerServiceFleet.createSearchContext({
  indexPatternId: 'wazuh-agents*',
  fixedFilters: [],
  contextId: 'fleet-management',
});

const response = await searchContext.executeQuery();
```

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant Client
    participant QMService as QueryManagerService
    participant Repository as IndexPatternRepository
    participant Context as SearchContext
    participant SearchService as DataService.search

    Client->>QMService: createSearchContext({ indexPatternId, fixedFilters, contextId })
    QMService->>QMService: getIndexPatternById(indexPatternId)

    alt Index pattern in cache
        QMService->>QMService: return cached IndexPattern
    else Index pattern not in cache
        QMService->>Repository: get(indexPatternId)
        Repository-->>QMService: IndexPattern
    end

    QMService->>Context: new SearchContext({ indexPattern, fixedFilters, contextId, searchService })
    Context->>Context: initialize with configuration
    Context-->>QMService: SearchContext instance
    QMService-->>Client: SearchContext instance
    Client->>Context: executeQuery()
    Context->>Context: getAllFilters()
    Context->>SearchService: searchSource.create()
    Context->>SearchService: setParent()
    Context->>SearchService: setField('filter', allFilters)
    Context->>SearchService: fetch()
    SearchService-->>Context: SearchResponse
    Context-->>Client: SearchResponse
```

### 4. Working with Fixed Filters

Add persistent filters when creating a search context:

```typescript
// Create a custom filter
const fixedFilter1 = FiltersService.createFilter(
  FILTER_OPERATOR.EXISTS,
  'field1',
  'value1',
  'wazuh-alerts-*',
);

const searchContext = await queryManagerServiceFleet.createSearchContext({
  indexPatternId: 'wazuh-agents*',
  fixedFilters: [fixedFilter1],
  contextId: 'fleet-management',
});
```

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant Client
    participant FilterService as FiltersService
    participant QMService as QueryManagerService
    participant Context as SearchContext

    Client->>FilterService: createFilter(FILTER_OPERATOR.EXISTS, 'field1', 'value1', 'wazuh-alerts-*')
    FilterService-->>Client: fixedFilter1
    Client->>QMService: createSearchContext({ indexPatternId, fixedFilters: [fixedFilter1], contextId })
    QMService->>QMService: getIndexPatternById(indexPatternId)
    QMService->>Context: new SearchContext({ indexPattern, fixedFilters: [fixedFilter1], contextId, searchService })
    Context->>Context: store fixedFilters
    Context-->>QMService: SearchContext instance
    QMService-->>Client: SearchContext instance
```

### 5. Working with User Filters

Add temporary user filters to an existing search context:

```typescript
// Create filters
const fixedFilter1 = FiltersService.createFilter(
  FILTER_OPERATOR.EXISTS,
  'field1',
  'value1',
  'wazuh-alerts-*',
);
const userFilter1 = FiltersService.createFilter(
  FILTER_OPERATOR.EXISTS,
  'field2',
  'value2',
  'wazuh-alerts-*',
);

// Create search context with fixed filters
const searchContext = await queryManagerServiceFleet.createSearchContext({
  indexPatternId: 'wazuh-agents*',
  fixedFilters: [fixedFilter1],
  contextId: 'fleet-management',
});

// Add user filters
searchContext.setUserFilters([userFilter1]);
```

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant Client
    participant FilterService as FiltersService
    participant QMService as QueryManagerService
    participant Context as SearchContext

    Client->>FilterService: createFilter(FILTER_OPERATOR.EXISTS, 'field1', 'value1', 'wazuh-alerts-*')
    FilterService-->>Client: fixedFilter1
    Client->>FilterService: createFilter(FILTER_OPERATOR.EXISTS, 'field2', 'value2', 'wazuh-alerts-*')
    FilterService-->>Client: userFilter1

    Client->>QMService: createSearchContext({ indexPatternId, fixedFilters: [fixedFilter1], contextId })
    QMService->>Context: new SearchContext({ indexPattern, fixedFilters: [fixedFilter1], contextId, searchService })
    Context-->>QMService: SearchContext instance
    QMService-->>Client: SearchContext instance

    Client->>Context: setUserFilters([userFilter1])
    Context->>Context: store userFilters
    Context-->>Client: void
```

### 6. Retrieving All Filters

Get all active filters (both fixed and user) from a search context:

```typescript
// Get all filters (combines fixed and user filters)
const allFilters = searchContext.getAllFilters();
```

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant Client
    participant Context as SearchContext

    Client->>Context: getAllFilters()
    Context->>Context: combine fixed and user filters
    Context-->>Client: allFilters (combined array)

    Note over Client,Context: This combined array is what's used<br/>during query execution
```

## Implementation Details

### QueryManagerService Class

The `QueryManagerService` class is responsible for:

1. Storing and retrieving index patterns
2. Creating search contexts
3. Managing dependencies (data service, index pattern repository)

It requires proper configuration through its constructor:

- A list of index patterns
- A data service for query execution
- An index pattern repository for fetching patterns not in memory
