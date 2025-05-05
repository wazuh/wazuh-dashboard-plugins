import { useRef, useEffect, useState, useCallback } from 'react';
import { StickyDataGridProps } from '../types/sticky-data-grid.types';

/**
 * Custom hook that manages the sticky behavior and dimensions of a data grid
 * @description
 * This hook handles the sticky positioning and dynamic measurements of a data grid component.
 * It manages column widths, row heights, and popover states while providing responsive
 * behavior through window resize and DOM mutation observations.
 *
 * @param {StickyDataGridProps} props - Props object for the sticky data grid
 * @returns {Object} An object containing grid references, dimensions, and control functions
 */
export const useStickyDataGrid = ({
  columns
}: StickyDataGridProps) => {
  const [dataGridControlsHeight, setDataGridControlsHeight] = useState(61.8);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [actionPopoverOpen, setActionPopoverOpen] = useState<number | null>(null);
  const [nameColumnWidth, setNameColumnWidth] = useState(130);
  const [rowSizes, setRowSizes] = useState({
    headerRowHeight: 34,
    dataRowHeight: 34,
  });
  // Reference to avoid repeated updates
  const lastUpdateRef = useRef({
    headerHeight: 0,
    timestamp: 0
  });
  const [sizesInitialized, setSizesInitialized] = useState(false);

  // Function to handle opening/closing the action column popover
  const toggleActionPopover = useCallback((rowIndex: number) => {
    if (actionPopoverOpen === rowIndex) {
      setActionPopoverOpen(null);
    } else {
      setActionPopoverOpen(rowIndex);
    }
  }, [actionPopoverOpen]);

  // Function to find and measure name column
  function findNameColumn() {
    if (!gridRef.current) return null;

    const columnName = columns?.[0];
    const nameColumn = gridRef.current.querySelector(
      `.euiDataGridHeaderCell[data-test-subj*="dataGridHeaderCell-${columnName?.id}"]`
    ) as HTMLElement;

    if (nameColumn) {
      const width = nameColumn.getBoundingClientRect().width;
      if (width > 0) {
        return width;
      }
    }

    return null;
  }

  // Function to find and measure controls column
  function findControlsColumn() {
    if (!gridRef.current) return null;

    let controlsColumn = gridRef.current.querySelector(
      `.euiDataGrid__controls`
    ) as HTMLElement;

    if (!controlsColumn) {
      controlsColumn = gridRef.current.querySelector(
        `.euiDataGrid__controls[data-test-sub*="dataGridControls"]`
      ) as HTMLElement;
    }

    if (controlsColumn) {
      const height = controlsColumn.getBoundingClientRect().height;
      if (height > 0) {
        return height;
      }
    }

    return null;
  }

  // Function to find and measure header row
  function findHeaderRow() {
    if (!gridRef.current) return null;

    let headerRowElement = gridRef.current.querySelector(
      `.euiDataGridHeaderCell[data-test-subj*="dataGridHeaderCell-checkbox"]`
    ) as HTMLElement;

    if (!headerRowElement) {
      headerRowElement = gridRef.current.querySelector(
        `.euiDataGridHeaderCell`
      ) as HTMLElement;
    }

    if (headerRowElement) {
      const actualCellHeight = headerRowElement.getBoundingClientRect().height;
      if (actualCellHeight > 0) {
        return actualCellHeight;
      }
    }

    return null;
  }

  // Function to update initial sizes
  const updateInitialSizes = useCallback(() => {
    if (!gridRef.current) return false;

    let updated = false;

    const nameWidth = findNameColumn();
    if (nameWidth) {
      setNameColumnWidth(nameWidth);
      updated = true;
    }

    const controlsHeight = findControlsColumn();
    if (controlsHeight) {
      setDataGridControlsHeight(controlsHeight);
      updated = true;
    }

    const headerHeight = findHeaderRow();
    if (headerHeight) {
      const roundedHeight = Math.round(headerHeight);
      setRowSizes(prevSizes => ({ ...prevSizes, headerRowHeight: roundedHeight }));

      // Update reference to avoid unnecessary updates
      lastUpdateRef.current = {
        headerHeight: roundedHeight,
        timestamp: Date.now()
      };
      updated = true;
    }

    return updated;
  }, [columns]);

  // useEffect for initialization - Attempts to initialize sizes with polling until success or timeout
  useEffect(() => {
    if (sizesInitialized) return;

    // Try to update sizes immediately
    const updated = updateInitialSizes();

    if (updated) {
      setSizesInitialized(true);
      return;
    }

    // If update failed, schedule attempts with intervals
    const intervalId = setInterval(() => {
      const success = updateInitialSizes();
      if (success) {
        clearInterval(intervalId);
        setSizesInitialized(true);
      }
    }, 100);

    // Set a maximum wait time (3 seconds)
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setSizesInitialized(true);
    }, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [updateInitialSizes, sizesInitialized]);

  // useEffect for subsequent updates - Handles resize events and DOM mutations to keep measurements in sync
  useEffect(() => {
    if (!sizesInitialized) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isUpdating = false; // Flag to avoid simultaneous updates

    const updateColumnWidthAndHeight = () => {
      if (isUpdating || !gridRef.current) return;
      isUpdating = true;

      const nameWidth = findNameColumn();
      if (nameWidth) {
        setNameColumnWidth(nameWidth);
      }

      const controlsHeight = findControlsColumn();
      if (controlsHeight) {
        setDataGridControlsHeight(controlsHeight);
      }

      const headerHeight = findHeaderRow();
      if (headerHeight) {
        const roundedHeight = Math.round(headerHeight);

        // Check if enough time has passed since the last update (500ms)
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current.timestamp;

        // Only update if:
        // 1. The value is greater than zero
        // 2. The difference with the last updated value is greater than 3px
        // 3. At least 500ms have passed since the last update
        if (
          Math.abs(roundedHeight - lastUpdateRef.current.headerHeight) > 3 &&
          timeSinceLastUpdate > 500
        ) {
          setRowSizes(prevSizes => ({ ...prevSizes, headerRowHeight: roundedHeight }));
          lastUpdateRef.current = {
            headerHeight: roundedHeight,
            timestamp: now
          };
        }
      }

      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdating = false;
      }, 100);
    };

    const debouncedUpdate = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        updateColumnWidthAndHeight();
      }, 300);
    };

    window.addEventListener('resize', debouncedUpdate);

    // Observe changes in the gridRef element and update when necessary
    if (gridRef.current) {
      const observer = new MutationObserver(debouncedUpdate);
      observer.observe(gridRef.current, {
        attributes: true,
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', debouncedUpdate);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [columns, sizesInitialized]);

  return {
    gridRef,
    isPopoverOpen,
    actionPopoverOpen,
    toggleActionPopover,
    setIsPopoverOpen,
    nameColumnWidth,
    dataGridControlsHeight,
    rowSizes
  };
};
