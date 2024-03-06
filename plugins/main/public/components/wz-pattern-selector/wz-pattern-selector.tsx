import React from 'react';
import { useEffect, useState } from 'react';
import {
    EuiFormRow,
    EuiSelect,
} from '@elastic/eui';
import { 
    DataSourceSelector, 
    tDataSource,
    PatternDataSource, 
    AlertsDataSourceRepository, 
    PatternDataSourceFactory } from '../common/data-source';
    
type tWzPatternSelector = {
    onChange?: (dataSource: tDataSource) => void;
}

const WzPatternSelector = (props: tWzPatternSelector) => {
    const { onChange } = props;
    const [dataSourceList, setDataSourceList] = useState<tDataSource[] | []>([]);
    const [selectedPattern, setSelectedPattern] = useState<tDataSource>();
    const [isLoading, setIsLoading] = useState(false);
    const dataSourceSelector = new DataSourceSelector(new AlertsDataSourceRepository(), new PatternDataSourceFactory());
    
    useEffect(() => {
        loadAlertsIndexPatterns();
    }, [])


    async function loadAlertsIndexPatterns() {
        // pass to the data source handler the data source factory
        // the data source handler will create the data source
        setIsLoading(true);
        const dataSourcesList = await dataSourceSelector.getAllDataSources();
        // load default index pattern
        const defaultIndexPattern = await dataSourceSelector.getSelectedDataSource();
        setSelectedPattern(defaultIndexPattern);
        setDataSourceList(dataSourcesList);
        setIsLoading(false);
    }

    async function selectDataSource(e) {
        const dataSourceId = e.target.value;
        try{
            // search in datasource list the selected index pattern
            await dataSourceSelector.selectDataSource(dataSourceId);
            setSelectedPattern(await dataSourceSelector.getDataSource(dataSourceId));
            onChange && onChange(selectedPattern);
        }catch(error){
            console.error(error);
        }
    }

    return (
        <EuiFormRow>
            <EuiSelect
                id='selectIndexPatternBar'
                options={dataSourceList.map((item) => {
                    return { value: item.id, text: item.title };
                })}
                value={selectedPattern?.id || dataSourceList[0]?.id }
                onChange={selectDataSource}
                aria-label='Index pattern selector'
            />
        </EuiFormRow>
    );
}

export default WzPatternSelector;