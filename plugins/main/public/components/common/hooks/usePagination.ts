import { useState, useCallback } from 'react';

/**
 * @interface PaginationResult
 * @description Response structure from paginated API endpoints
 * Supports flexible property names for the data array (data, users, rules, etc.)
 * @property {T[] | undefined} data - Array of items from the API (alternative property name)
 * @property {T[] | undefined} users - Array of users from the API (alternative property name)
 * @property {T[] | undefined} rules - Array of rules from the API (alternative property name)
 * @property {T[] | undefined} [key: string] - Any other array property name
 * @property {number} total - Total count of items available in the API
 */
interface PaginationResult<T> {
  data?: T[];
  users?: T[];
  rules?: T[];
  [key: string]: T[] | number | undefined;
  total: number;
}

/**
 * @interface UsePaginationReturn
 * @description Return value from the usePagination hook containing state and methods
 * @property {T[]} items - Current page items
 * @property {boolean} loading - Loading state indicator
 * @property {number} pageIndex - Current page index (0-based)
 * @property {number} pageSize - Number of items per page
 * @property {number} totalItems - Total number of items in the API
 * @property {(pageIndex?: number, pageSize?: number) => Promise<void>} getData - Function to fetch paginated data
 * @property {() => Promise<void>} refreshCurrentPage - Function to refresh the current page
 * @property {(change: any) => void} onTableChange - Handler for table pagination changes
 */
interface UsePaginationReturn<T> {
  items: T[];
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  getData: (pageIndex?: number, pageSize?: number) => Promise<void>;
  refreshCurrentPage: () => Promise<void>;
  onTableChange: (change: any) => void;
}

/**
 * Custom hook for managing paginated data from API endpoints
 *
 * @template T - The type of items in the paginated response
 * @param {function} fetchFunction - Async function that fetches paginated data. Should return {data: T[], total: number}
 * @param {function} [onError] - Optional callback function called when an error occurs during data fetching
 *
 * @returns {UsePaginationReturn<T>} Object containing pagination state and methods
 *
 * @description
 * This hook abstracts the state management and logic for paginated data retrieval.
 * It's designed to work with EuiBasicTable for server-side pagination.
 *
 * Used in security modules:
 * - Users component: Manages user list pagination
 * - Roles component: Manages role list pagination
 * - Policies component: Manages policy list pagination
 * - RolesMapping component: Manages role mapping rules pagination
 *
 * @example
 * // Basic usage
 * const { items, loading, pageIndex, pageSize, totalItems, onTableChange, getData } =
 *   usePagination(UsersServices.GetUsers);
 *
 * // Initialize data on component mount
 * useEffect(() => {
 *   getData();
 * }, [getData]);
 *
 * // Handle table changes (pagination, sorting, etc.)
 * <EuiBasicTable
 *   items={items}
 *   pagination={{ pageIndex, pageSize, totalItemCount: totalItems, pageSizeOptions: [5, 10, 25, 50] }}
 *   onChange={onTableChange}
 *   loading={loading}
 * />
 */
export function usePagination<T>(
  fetchFunction: (
    offset: number,
    limit: number,
  ) => Promise<PaginationResult<T>>,
  onError?: (error: any) => void,
): UsePaginationReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Fetches paginated data from the API
   * @param {number} [pageIndex=0] - Page index (0-based)
   * @param {number} [pageSize=10] - Number of items per page
   */
  const getData = useCallback(
    async (pageIndex = 0, pageSize = 10) => {
      setLoading(true);
      try {
        const offset = pageIndex * pageSize;
        const result = await fetchFunction(offset, pageSize);

        // Extract items from any property (data, users, rules, etc.)
        let itemsData: T[] = [];
        if (result.data) {
          itemsData = result.data;
        } else if (result.users) {
          itemsData = result.users;
        } else if (result.rules) {
          itemsData = result.rules;
        } else {
          // Try to find the first array property
          for (const key in result) {
            if (key !== 'total' && Array.isArray(result[key])) {
              itemsData = result[key];
              break;
            }
          }
        }

        setItems(itemsData);
        setTotalItems(result.total);
        setPageIndex(pageIndex);
        setPageSize(pageSize);
      } catch (error) {
        setItems([]);
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, onError],
  );

  /**
   * Refreshes the current page data
   * Useful for reloading data after create/update/delete operations
   */
  const refreshCurrentPage = useCallback(async () => {
    return getData(pageIndex, pageSize);
  }, [pageIndex, pageSize, getData]);

  /**
   * Handler for EuiBasicTable onChange event
   * Manages page changes and page size changes
   * Resets to first page when page size changes
   *
   * @param {object} change - Change object from EuiBasicTable
   * @param {object} change.page - Page object containing index and size
   */
  const onTableChange = useCallback(
    ({ page }: any) => {
      if (page) {
        // Reset to first page if page size changed
        const newPageIndex = page.size !== pageSize ? 0 : page.index;
        getData(newPageIndex, page.size);
      }
    },
    [getData, pageSize],
  );

  return {
    items,
    loading,
    pageIndex,
    pageSize,
    totalItems,
    getData,
    refreshCurrentPage,
    onTableChange,
  };
}
