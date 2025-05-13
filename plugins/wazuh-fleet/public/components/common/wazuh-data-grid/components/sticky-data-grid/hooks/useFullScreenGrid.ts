import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook to handle fullscreen behavior and grid dimensions
 * @description
 * This hook manages fullscreen mode detection, height calculations and scroll synchronization
 * for grid components with sticky columns.
 *
 * @param {RefObject<HTMLDivElement>} gridRef - Reference to the main grid container
 * @param {number} headerRowHeight - Header row height
 * @returns {Object} Object with states and references to manage fullscreen mode
 */
export const useFullScreenGrid = (
  gridRef: RefObject<HTMLDivElement>,
  headerRowHeight: number
) => {
  // States for fullscreen mode and dimensions
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [gridContentHeight, setGridContentHeight] = useState(0);
  const [breadcrumbHeight, setBreadcrumbHeight] = useState(0);
  const verticalScrollRef = useRef<HTMLElement | null>(null);

  // References for sticky columns
  const checkboxColumnRef = useRef<HTMLDivElement>(null);
  const inspectColumnRef = useRef<HTMLDivElement>(null);
  const nameColumnRef = useRef<HTMLDivElement>(null);
  const actionsColumnRef = useRef<HTMLDivElement>(null);

  // Detect fullscreen mode and get breadcrumb height
  useEffect(() => {
    const checkFullScreenMode = () => {
      const fullScreenGrid = document.querySelector('.euiDataGrid--fullScreen');
      setIsFullScreen(!!fullScreenGrid);

      // If we are in fullscreen mode, get the breadcrumb height
      if (fullScreenGrid) {
        const breadcrumbElement = document.querySelector('nav.euiBreadcrumbs.euiHeaderBreadcrumbs') as HTMLElement;
        if (breadcrumbElement) {
          const height = breadcrumbElement.getBoundingClientRect().height;
          setBreadcrumbHeight(height);
        }
      } else {
        setBreadcrumbHeight(0);
      }
    };

    checkFullScreenMode();

    // Observe DOM changes
    const observer = new MutationObserver(() => {
      checkFullScreenMode();
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Get and update table content height
  useEffect(() => {
    const updateVerticalScrollHeight = () => {
      if (!gridRef.current) return;

      const verticalScrollElement = gridRef.current.querySelector('.euiDataGrid__verticalScroll') as HTMLElement;

      if (verticalScrollElement) {
        verticalScrollRef.current = verticalScrollElement;
        const height = verticalScrollElement.getBoundingClientRect().height;
        if (height > 0) {
          setGridContentHeight(height - headerRowHeight);
        }
      }
    };

    // Try to get height immediately
    updateVerticalScrollHeight();

    // Set up interval to try getting height if not immediately available
    const intervalId = setInterval(() => {
      updateVerticalScrollHeight();
    }, 100);

    // Set maximum wait time (1 second)
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 1000);

    // Observe DOM changes to update height when it changes
    const observer = new MutationObserver(() => {
      updateVerticalScrollHeight();
    });

    if (gridRef.current) {
      observer.observe(gridRef.current, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }

    // Update height when window size changes
    const handleResize = () => {
      updateVerticalScrollHeight();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [gridRef.current, isFullScreen, headerRowHeight]);

  // Synchronize scroll between main table and sticky columns
  useEffect(() => {
    if (!gridRef.current || !verticalScrollRef.current) return;

    const mainScrollElement = gridRef.current.querySelector('.euiDataGrid__virtualized') as HTMLElement;

    if (!mainScrollElement) return;

    const syncScroll = (e: Event) => {
      const scrollTop = (e.target as HTMLElement).scrollTop;

      // Synchronize scroll in all sticky columns
      if (checkboxColumnRef.current) {
        checkboxColumnRef.current.scrollTop = scrollTop;
      }

      if (inspectColumnRef.current) {
        inspectColumnRef.current.scrollTop = scrollTop;
      }

      if (nameColumnRef.current) {
        nameColumnRef.current.scrollTop = scrollTop;
      }

      if (actionsColumnRef.current) {
        actionsColumnRef.current.scrollTop = scrollTop;
      }
    };

    // Synchronize scroll from sticky columns to main table
    const syncMainScroll = (e: Event) => {
      const scrollTop = (e.target as HTMLElement).scrollTop;
      mainScrollElement.scrollTop = scrollTop;
    };

    // Add scroll event listeners
    mainScrollElement.addEventListener('scroll', syncScroll);

    // Add event listeners for sticky columns
    const stickyColumns = [
      checkboxColumnRef.current,
      inspectColumnRef.current,
      nameColumnRef.current,
      actionsColumnRef.current
    ].filter(Boolean);

    stickyColumns.forEach(column => {
      column?.addEventListener('scroll', syncMainScroll);
    });

    return () => {
      mainScrollElement.removeEventListener('scroll', syncScroll);
      stickyColumns.forEach(column => {
        column?.removeEventListener('scroll', syncMainScroll);
      });
    };
  }, [gridRef.current, verticalScrollRef.current, checkboxColumnRef.current,
      inspectColumnRef.current, nameColumnRef.current, actionsColumnRef.current]);

  // Calculate style for sticky columns
  const getStickyColumnStyle = (dataGridControlsHeight: number) => {
    return {
      height: gridContentHeight > 0 ? `${gridContentHeight}px` : 'auto',
      overflowY: isFullScreen ? 'hidden' : (gridContentHeight > 0 ? 'auto' : 'visible'),
      position: isFullScreen ? 'fixed' : 'absolute',
      top: isFullScreen ? dataGridControlsHeight + headerRowHeight + breadcrumbHeight - 3 : dataGridControlsHeight + headerRowHeight,
    } as React.CSSProperties;
  };

  return {
    isFullScreen,
    gridContentHeight,
    breadcrumbHeight,
    verticalScrollRef,
    checkboxColumnRef,
    inspectColumnRef,
    nameColumnRef,
    actionsColumnRef,
    getStickyColumnStyle
  };
};
