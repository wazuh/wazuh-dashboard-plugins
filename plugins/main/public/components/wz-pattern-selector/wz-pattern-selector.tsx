import React from 'react';
import { useEffect, useState } from 'react';
import {
    EuiFormRow,
    EuiSelect,
} from '@elastic/eui';
import {
    tDataSourceSelector
} from '../common/data-source';
import {
    ErrorHandler,
    ErrorFactory,
    HttpError,
} from '../../react-services/error-management';

type tWzPatternSelector = {
    onChange?: (dataSource: tDataSource) => void;
    dataSourceSelector: tDataSourceSelector;
}

const WzPatternSelector = (props: tWzPatternSelector) => {
    const { onChange, dataSourceSelector } = props;
    const [dataSourceList, setDataSourceList] = useState<tDataSource[] | []>([]);
    const [selectedPattern, setSelectedPattern] = useState<tDataSource>();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadAlertsIndexPatterns();
    }, [])

    async function loadAlertsIndexPatterns() {
        setIsLoading(true);
        const dataSourcesList = await dataSourceSelector.getAllDataSources();
        const defaultIndexPattern = await dataSourceSelector.getSelectedDataSource();
        setSelectedPattern(defaultIndexPattern);
        setDataSourceList(dataSourcesList);
        setIsLoading(false);
    }

    async function selectDataSource(e) {
        const dataSourceId = e.target.value;
        try {
            await dataSourceSelector.selectDataSource(dataSourceId);
            setSelectedPattern(await dataSourceSelector.getDataSource(dataSourceId));
            onChange && onChange(selectedPattern);
        } catch (error) {
            const searchError = ErrorFactory.create(HttpError, {
                error,
                message: 'Error selecting index pattern',
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
                value={selectedPattern?.id || dataSourceList[0]?.id}
                onChange={selectDataSource}
                aria-label='Index pattern selector'
            />
        </EuiFormRow>
    );
}

export default WzPatternSelector;