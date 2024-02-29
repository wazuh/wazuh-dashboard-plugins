import React from 'react';
import { useEffect } from 'react';
import { DataSourceHandler } from '../data-source';
import { IndexerDataSourceFactory } from './indexer-data-source-factory';

const DataSourceSelector = () => {

    useEffect(() => {
        loadIndexPatterns();
    }, [])

    async function loadIndexPatterns() {
        // pass to the data source handler the data source factory
        // the data source handler will create the data source
        const dataSourceHandler = new DataSourceHandler(new IndexerDataSourceFactory());
        const dataSourcesList = dataSourceHandler.getDataSources();
    }

    return (
        <div>
            select
        </div>
    )
}

export default DataSourceSelector;

