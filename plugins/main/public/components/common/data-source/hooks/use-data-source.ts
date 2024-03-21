import React, { useEffect, useState } from "react";
import { tFilter, tSearchParams } from "../search-params-builder";
import {
    tDataSource,
    tDataSourceFactory,
    DataSourceRepository,
    DataSourceSelector,
    DataSourceFilterManager
} from '../index';

type tUseDataSourceProps<T, K> = {
    filters: tFilter[];
    factory: tDataSourceFactory<T, K>;
    repository: DataSourceRepository<T, K>;
}

type tUseDataSourceLoadedReturns<K> = {
    isLoading: boolean;
    dataSource: K;
    filters: tFilter[];
    fetchFilters: tFilter[];
    fixedFilters: tFilter[];
    fetchData: () => Promise<any>;
    setFilters: (filters: tFilter[]) => void;
}

type tUseDataSourceNotLoadedReturns = {
    isLoading: boolean;
    dataSource: undefined;
    filters: [];
    fetchFilters: [];
    fixedFilters: [];
    fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
    setFilters: (filters: tFilter[]) => void;
}

export function useDataSource<T, K>(props: tUseDataSourceProps<T, K>): tUseDataSourceLoadedReturns<K> | tUseDataSourceNotLoadedReturns {
    const { filters: defaultFilters = [], factory, repository } = props;

    if (!factory || !repository) {
        throw new Error('Factory and repository are required');
    }

    const [dataSource, setDataSource] = useState<tDataSource>();
    const [dataSourceFilterManager, setDataSourceFilterManager] = useState<DataSourceFilterManager | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchFilters, setFetchFilters] = useState<tFilter[]>([]);
    const [allFilters, setAllFilters] = useState<tFilter[]>([]);

    const setFilters = (filters: tFilter[]) => {
        if (!dataSourceFilterManager) {
            return;
        }
        dataSourceFilterManager?.setFilters(filters);
        setAllFilters(dataSourceFilterManager?.getFilters() || []);
        setFetchFilters(dataSourceFilterManager?.getFetchFilters() || []);
    }

    const fetchData = async (params: Omit<tSearchParams, 'filters'>) => {
        if (!dataSourceFilterManager) {
            return
        }
        return await dataSourceFilterManager?.fetch(params);
    }

    useEffect(() => {
        init();
    }, [])

    const init = async () => {
        setIsLoading(true);
        const selector = new DataSourceSelector(repository, factory);
        const dataSource = await selector.getSelectedDataSource();
        if (!dataSource) {
            throw new Error('No valid data source found');
        }
        const dataSourceFilterManager = new DataSourceFilterManager(dataSource, defaultFilters);
        if (!dataSourceFilterManager) {
            throw new Error('Error creating filter manager');
        }
        setAllFilters(dataSourceFilterManager.getFilters());
        setFetchFilters(dataSourceFilterManager.getFetchFilters());
        setDataSourceFilterManager(dataSourceFilterManager);
        setDataSource(dataSource);
        setIsLoading(false);
    }

    if (isLoading) {
        return {
            isLoading: true,
            dataSource,
            filters: [],
            fetchFilters: [],
            fixedFilters: [],
            fetchData,
            setFilters
        }
    }

    return {
        isLoading: false,
        dataSource,
        filters: allFilters,
        fetchFilters,
        fixedFilters: dataSourceFilterManager?.getFixedFilters() || [],
        fetchData,
        setFilters
    }

}