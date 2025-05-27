import React, { useEffect, useState } from "react";
import { useDataGrid } from "../data-grid";
import { useStickyDataGrid } from "./components/sticky-data-grid/hooks/use-sticky-data-grid";
import { useRowSelection } from "./hooks/use-row-selection";
import { WazuhDataGridContextProvider } from "./wz-data-grid-context";
import StickyDataGrid from "./components/sticky-data-grid/sticky-data-grid";
import DiscoverDataGridAdditionalControls from "./components/data-grid-additional-controls";
import { MAX_ENTRIES_PER_QUERY } from "../data-grid/constants";
import { DocumentFlyout } from "./components/document-fly-out";
import { DiscoverNoResults } from "../no-results/no-results";
import { LoadingSpinner } from "../loading-spinner/loading-spinner";
import { useExportResults } from "./hooks/use-export-results";
import { TWazuhDataGridProps } from "./interfaces/wz-data-grid.interfaces";
import './wazuh-data-grid.scss';

const WazuhDataGrid = (props: TWazuhDataGridProps) => {
  const { indexPattern, results, defaultColumns, isLoading, onChangeSorting, onChangePagination, appId } = props;
  const [inspectedHit, setInspectedHit] = useState<any>();
  const timeField = indexPattern?.timeFieldName;
  const dataGridProps = useDataGrid({ ...props, ariaLabelledBy: 'Actions data grid', });
  const stickyProps = useStickyDataGrid({ columns: dataGridProps.columns });

  useEffect(() => {
    onChangePagination(dataGridProps.pagination);
  }, [appId, JSON.stringify(dataGridProps.pagination)]);

  useEffect(() => {
    if (onChangeSorting) {
      onChangeSorting(dataGridProps.sorting || []);
    }
  }, [JSON.stringify(dataGridProps.sorting)]);

  const { isExporting, onClickExportResults } = useExportResults({
    indexPattern, exportFilters: props.exportFilters, query: props.query,
    visibleColumns: dataGridProps.columnVisibility.visibleColumns,
    results, sorting: dataGridProps.sorting
  });

  const [selectedRows, dispatchRowSelection] = useRowSelection(
    () => { }, results
  );

  if (isLoading || results?.hits?.total === undefined) return <LoadingSpinner />;
  if (!isLoading && results?.hits?.total === 0) return <DiscoverNoResults timeField={timeField} queryLanguage={''} />;

  return (
    <>
      <div className='wazuhDataGridContainer'>
        <WazuhDataGridContextProvider value={[selectedRows, dispatchRowSelection]}>
          <StickyDataGrid
            dataGridProps={dataGridProps}
            stickyDataGridProps={{
              ...stickyProps,
              onClickInspectDoc: setInspectedHit,
              actionsColumn: props.actionsColumn || [],
              agentsRows: results?.hits?.hits,
              rowCount: results?.hits?.total,
            }}
            toolbarVisibility={{
              showColumnSelector: false,
              additionalControls: (
                <DiscoverDataGridAdditionalControls
                  totalHits={results?.hits?.total}
                  isExporting={isExporting}
                  onClickExportResults={onClickExportResults}
                  maxEntriesPerQuery={MAX_ENTRIES_PER_QUERY}
                  dateRange={props.dateRange}
                  columnsAvailable={dataGridProps.columnsAvailable}
                  columnVisibility={dataGridProps.columnVisibility}
                  selectedRows={selectedRows}
                />
              )
            }}
          />
        </WazuhDataGridContextProvider>
      </div>
      {inspectedHit && (
        <DocumentFlyout
          hit={inspectedHit}
          onClose={() => setInspectedHit(undefined)}
          indexPattern={indexPattern}
          renderFields={defaultColumns.filter(item => item.render)}
        />
      )}
    </>
  );
};

export default WazuhDataGrid;
