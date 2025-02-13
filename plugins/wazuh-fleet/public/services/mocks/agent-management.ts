import { cloneDeep } from 'lodash';
import { agentsMock } from './agents-data';

export const queryManagerService = () => {
  const state = {
    currentFilters: [],
    currentPagination: {
      pageSize: 10,
      pageIndex: 0,
    },
    currentSort: {
      field: '_id',
      direction: 'asc',
    },
    currentQuery: '',
  };

  const addFilter = (filters = []) => {
    state.currentFilters = Array.isArray(filters) ? filters : [filters];

    // eslint-disable-next-line no-use-before-define
    return manager;
  };

  const addPagination = pagination => {
    state.currentPagination = pagination;

    // eslint-disable-next-line no-use-before-define
    return manager;
  };

  const addSort = sort => {
    state.currentSort = sort;

    // eslint-disable-next-line no-use-before-define
    return manager;
  };

  const addQuery = query => {
    state.currentQuery = query;

    // eslint-disable-next-line no-use-before-define
    return manager;
  };

  const executeQuery = () => {
    const filteredAgents = cloneDeep(agentsMock);

    // Apply filters
    if (state.currentFilters.length > 0) {
      filteredAgents.hits.hits = filteredAgents.hits.hits.filter(agent =>
        state.currentFilters.every(filter => {
          const [field, value] = filter.split(':');
          const fieldPath = field.split('.');
          let fieldValue = agent._source;

          for (const path of fieldPath) {
            fieldValue = fieldValue[path];

            if (!fieldValue) {
              return false;
            }
          }

          return fieldValue
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        }),
      );
    }

    // Apply query (search in all fields)
    if (state.currentQuery && state.currentQuery.length > 0) {
      filteredAgents.hits.hits = filteredAgents.hits.hits.filter(agent => {
        const searchIn = JSON.stringify(agent._source).toLowerCase();

        // Fix query reference

        return searchIn.includes(state.currentQuery.toLowerCase());
      });
    }

    // Apply sort
    if (state.currentSort && state.currentSort.field) {
      filteredAgents.hits.hits.sort((a, b) => {
        let valueA, valueB;

        if (state.currentSort.field === '_id') {
          valueA = a?._id;
          valueB = b?._id;
        } else {
          const fieldPath = state.currentSort.field?.split('.');

          valueA = a?._source;
          valueB = b?._source;

          for (const path of fieldPath) {
            if (!valueA || !valueB) {
              break;
            }

            valueA = valueA?.[path];
            valueB = valueB?.[path];
          }
        }

        if (!valueA || !valueB) {
          return 0;
        }

        return state.currentSort.direction === 'asc'
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
      });
    }

    // Apply pagination
    if (state.currentPagination) {
      const { pageIndex, pageSize } = state.currentPagination;
      const start = pageIndex * pageSize;
      const end = start + pageSize;

      filteredAgents.hits.hits = filteredAgents.hits.hits.slice(start, end);
    }

    return filteredAgents;
  };

  const manager = {
    addFilter,
    addPagination,
    addSort,
    addQuery,
    executeQuery,
  };

  return manager;
};
