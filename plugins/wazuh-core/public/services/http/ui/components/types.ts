import { SearchBarProps } from '../../../../components';
import { TableDataProps } from '../../../../components/table-data/types';

export interface ServerDataProps<T> extends TableDataProps<T> {
  /**
   * Component to render the export formatted action
   */
  ActionExportFormatted: any;
  /**
   * Properties for the search bar
   */
  searchBarProps?: Omit<
    SearchBarProps,
    'defaultMode' | 'modes' | 'onSearch' | 'input'
  >;
  /**
   * Options releated to WQL. This is a shortcut that add properties to the WQL language.
   */
  searchBarWQL?: {
    options: {
      searchTermFields: string[];
      implicitQuery: {
        query: string;
        conjunction: ';' | ',';
      };
    };
    suggestions?: {
      field?: () => any;
      value?: () => any;
    };
    validate?: {
      field?: () => any;
      value?: () => any;
    };
  };
  /**
   * Show the search bar
   */
  showSearchBar?: boolean;
  /**
   * Show the the export formatted action
   */
  showActionExportFormatted?: boolean;
}
