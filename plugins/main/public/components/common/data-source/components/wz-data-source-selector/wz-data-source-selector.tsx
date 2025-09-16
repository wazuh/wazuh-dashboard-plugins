import React from 'react';
import { useState } from 'react';
import { EuiFormRow, EuiSelect, EuiButtonIcon } from '@elastic/eui';
import {
  tDataSource,
  tDataSourceSelector,
  PatternDataSourceFactory,
  PatternDataSource,
  tParsedIndexPattern,
} from '../../index';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../../react-services/error-management';
import { PatternDataSourceSelector } from '../../pattern/pattern-data-source-selector';
import { useAsyncActionRunOnStart } from '../../../hooks';
import NavigationService from '../../../../../react-services/navigation-service';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import {
  Selector,
  SelectorContainer,
  SelectorLabel,
} from '../../../../wz-menu/selectors';

type tWzDataSourceSelector<T extends tParsedIndexPattern> = {
  name: 'string';
  onChange?: (dataSource: T) => void;
  DataSourceRepositoryCreator: any;
  DataSource: any;
  refetchDependencies?: any[];
  showSelectorsInPopover: boolean;
};

async function fetchDataSourceList(...params) {
  const [
    DataSource,
    DataSourceRepositoryCreator,
    setDataSourceSelector,
    setSelectedPattern,
  ] = params;
  const factory = new PatternDataSourceFactory();
  const repository = new DataSourceRepositoryCreator();
  const dataSources = await factory.createAll(
    DataSource,
    await repository.getAll(),
  );
  const selector = new PatternDataSourceSelector(dataSources, repository);
  setDataSourceSelector(selector);
  try {
    const defaultIndexPattern = await selector.getSelectedDataSource();
    setSelectedPattern(defaultIndexPattern);
  } catch {}
  return await selector.getAllDataSources();
}

const WzDataSourceSelector = (
  props: tWzDataSourceSelector<tParsedIndexPattern, PatternDataSource>,
) => {
  const {
    name = 'data source',
    DataSource,
    DataSourceRepositoryCreator,
    refetchDependencies,
    showSelectorsInPopover,
  } = props;
  const [selectedPattern, setSelectedPattern] = useState<tDataSource>();
  const [dataSourceSelector, setDataSourceSelector] = useState<
    tDataSourceSelector<PatternDataSource> | undefined
  >(undefined);

  const action = useAsyncActionRunOnStart(fetchDataSourceList, [
    DataSource,
    DataSourceRepositoryCreator,
    setDataSourceSelector,
    setSelectedPattern,
    ...(refetchDependencies || []),
  ]);

  const onChange = async () => {
    try {
      /* TODO: this reloads the page to force the components are remounted with the new
          selection of. To avoid this refresh, we would have to do the components are able to react
          to these changes redoing the requests, etc... This will need a considerable time to
          apply the changes. The reload of the pages is the same behavior used for the routing based
          on AngularJS.
          */
      NavigationService.getInstance().reload();
    } catch (error) {
      const options = {
        context: `${WzDataSourceSelector.name}.onChangePattern`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: false,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error changing the Index Pattern`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  async function selectDataSource(e) {
    const dataSourceId = e.target.value;
    if (!dataSourceSelector) {
      throw new Error('Data source selector not initialized');
    }
    try {
      await dataSourceSelector.selectDataSource(dataSourceId);
      const selected = await dataSourceSelector.getSelectedDataSource();
      setSelectedPattern(await dataSourceSelector.getDataSource(dataSourceId));
      onChange && onChange(selected.toJSON());
    } catch (error) {
      const searchError = ErrorFactory.create(HttpError, {
        error,
        message: `Error selecting the ${name.toLowerCase()} '${dataSourceId}`,
      });
      ErrorHandler.handleError(searchError);
    }
  }

  let style = { maxWidth: 250, maxHeight: 50 };
  if (showSelectorsInPopover) {
    style = { width: '100%', maxHeight: 50, minWidth: 220 };
  }

  const notSelected = !Boolean(selectedPattern?.id);
  const actionError =
    action.error?.message ||
    (!action.running && notSelected && 'Index pattern is not selected');

  const isInvalid = Boolean(actionError);

  return (
    <SelectorContainer>
      <SelectorLabel
        actionError={actionError}
        showSelectorsInPopover={showSelectorsInPopover}
      >
        Index pattern
      </SelectorLabel>
      <Selector showSelectorsInPopover={showSelectorsInPopover}>
        <div style={style}>
          <EuiFormRow fullWidth isInvalid={isInvalid}>
            <EuiSelect
              options={(action.data || []).map(item => {
                return { value: item.id, text: item.title };
              })}
              value={selectedPattern?.id}
              onChange={selectDataSource}
              aria-label={name}
              hasNoInitialSelection={notSelected}
              isInvalid={isInvalid}
              append={
                <EuiButtonIcon
                  iconType='refresh'
                  color='primary'
                  isDisabled={action.running}
                  onClick={() => {
                    action.run();
                  }}
                ></EuiButtonIcon>
              }
            />
          </EuiFormRow>
        </div>
      </Selector>
    </SelectorContainer>
  );
};

export default WzDataSourceSelector;
