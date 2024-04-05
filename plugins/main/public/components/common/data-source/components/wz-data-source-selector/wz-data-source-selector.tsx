import React from 'react';
import { useEffect, useState } from 'react';
import {
    EuiFormRow,
    EuiSelect,
} from '@elastic/eui';
import {
    tDataSource,
    tDataSourceSelector,
    PatternDataSourceFactory,
    PatternDataSource,
    AlertsDataSourceRepository,
    tParsedIndexPattern
} from '../../index';
import {
    ErrorHandler,
    ErrorFactory,
    HttpError,
} from '../../../../../react-services/error-management';
import { 
    PatternDataSourceSelector,
} from '../../pattern/pattern-data-source-selector';

type tWzDataSourceSelector<T extends tParsedIndexPattern, K extends tDataSource> = {
    name: 'string';
    onChange?: (dataSource: T) => void;
    dataSourceSelector?: tDataSourceSelector<K>;
}

const WzDataSourceSelector = (props: tWzDataSourceSelector<tParsedIndexPattern, PatternDataSource>) => {
    const { onChange, name = 'data source', dataSourceSelector: defaultDataSourceSelector } = props;
    const [dataSourceList, setDataSourceList] = useState<tDataSource[]>([]);
    const [selectedPattern, setSelectedPattern] = useState<tDataSource>();
    const [dataSourceSelector, setDataSourceSelector] = useState<tDataSourceSelector<PatternDataSource> | undefined>(defaultDataSourceSelector);

    useEffect(() => {
        init();
    }, [])

    async function init() {
        let selector;
        let dataSources;
        if(!dataSourceSelector){
            const factory = new PatternDataSourceFactory();
            const repository = new AlertsDataSourceRepository();
            dataSources = await factory.createAll(PatternDataSource,await repository.getAll());
            selector = new PatternDataSourceSelector(dataSources, repository);
            setDataSourceSelector(selector);
        }
        const defaultIndexPattern = await selector.getSelectedDataSource();
        dataSources = await selector.getAllDataSources();
        setSelectedPattern(defaultIndexPattern);
        setDataSourceList(dataSources);
    }

    async function selectDataSource(e) {
        const dataSourceId = e.target.value;
        if(!dataSourceSelector){
            throw new Error('Data source selector not initialized');
        };
        try {
            await dataSourceSelector.selectDataSource(dataSourceId);
            const selected = await dataSourceSelector.getSelectedDataSource();
            setSelectedPattern(await dataSourceSelector.getDataSource(dataSourceId));
            onChange && onChange(selected.toJSON());
        } catch (error) {
            const searchError = ErrorFactory.create(HttpError, {
                error,
                message: `Error selecting the ${name.toLowerCase()} '${dataSourceId}`
            });
            ErrorHandler.handleError(searchError);
        }
    }

    return (
        <EuiFormRow>
            <EuiSelect
                options={dataSourceList.map((item) => {
                    return { value: item.id, text: item.title };
                })}
                value={selectedPattern?.id}
                onChange={selectDataSource}
                aria-label={name}
            />
        </EuiFormRow>
    );
}

export default WzDataSourceSelector;