import React, { useMemo } from 'react';
import { EuiSpacer } from '@elastic/eui';
import { SearchBar, TableData } from '../../../../components';
import { ServerDataProps } from './types';

export function ServerTableData<T>({
  showActionExportFormatted,
  postActionButtons,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ActionExportFormatted,
  ...props
}: ServerDataProps<T>) {
  return (
    <TableData
      {...props}
      postActionButtons={params => (
        <>
          {showActionExportFormatted && (
            <ActionExportFormatted
              {...{
                fetchContext: params.fetchContext,
                totalItems: params.totalItems,
              }}
            />
          )}
          {postActionButtons && postActionButtons(params)}
        </>
      )}
      preTable={
        props.showSearchBar &&
        (({ tableColumns, ...rest }) => {
          /* Render search bar*/
          const searchBarWQLOptions = useMemo(
            () => ({
              searchTermFields: tableColumns
                .filter(
                  ({ field, searchable }) =>
                    searchable && rest.selectedFields.includes(field),
                )
                .flatMap(({ field, composeField }) =>
                  [composeField || field].flat(),
                ),
              ...rest?.searchBarWQL?.options,
            }),
            [rest?.searchBarWQL?.options, rest?.selectedFields],
          );

          return (
            <>
              <SearchBar
                {...rest.searchBarProps}
                defaultMode='wql'
                modes={[
                  {
                    id: 'wql',
                    options: searchBarWQLOptions,
                    ...(rest?.searchBarWQL?.suggestions
                      ? { suggestions: rest.searchBarWQL.suggestions }
                      : {}),
                    ...(rest?.searchBarWQL?.validate
                      ? { validate: rest.searchBarWQL.validate }
                      : {}),
                  },
                ]}
                input={rest?.filters?.q || ''}
                onSearch={({ apiQuery }) => {
                  // Set the query, reset the page index and update the refresh
                  rest.setFetchContext({
                    ...rest.fetchContext,
                    filters: apiQuery,
                  });
                  rest.updateRefresh();
                }}
              />
              <EuiSpacer size='s' />
            </>
          );
        })
      }
    />
  );
}
