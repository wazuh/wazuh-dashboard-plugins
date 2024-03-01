import React from 'react';
import { useEffect, useState } from 'react';
import { DataSourceService, tDataSource, AlertsDataSourceRepository, IndexerDataSourceFactory } from '../data-source';
import {
    EuiFormRow,
    EuiSelect,
} from '@elastic/eui';

const PatternSelector = () => {
    const [dataSourceList, setDataSourceList] = useState<tDataSource[] | []>([]);

    useEffect(() => {
        loadAlertsIndexPatterns();
    }, [])

    async function loadAlertsIndexPatterns() {
        // pass to the data source handler the data source factory
        // the data source handler will create the data source
        const dataSourceHandler = new DataSourceService(new AlertsDataSourceRepository(), new IndexerDataSourceFactory());
        const dataSourcesList = await dataSourceHandler.getAllDataSources();
        setDataSourceList(dataSourcesList);
        console.log('list', dataSourcesList);
    }

    async function selectDataSource() {
        try{
            await dataSourceList[0].select();
        }catch(error){
            console.error('Error selecting index pattern', error);
        }
    }

    return (
        <EuiFormRow label='Selected index pattern'>
            <EuiSelect
                id='selectIndexPattern'
                options={dataSourceList.map(item => {
                    return { value: item.id, text: item.title };
                })}
                value={dataSourceList[0]?.id || null}
                onChange={selectDataSource}
                aria-label='Index pattern selector'
            />
        </EuiFormRow>
    );
}

export default PatternSelector;