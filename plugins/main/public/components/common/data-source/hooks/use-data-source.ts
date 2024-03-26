import React, { useEffect, useState } from "react";
import {
    tDataSource,
    tDataSourceRepository,
    tFilter, 
    tSearchParams, 
    PatternDataSourceSelector,
    PatternDataSourceFactory,
    VulnerabilitiesDataSource,
    PatternDataSource,
    tParsedIndexPattern,
    PatternDataSourceFilterManager
} from '../index';

type tUseDataSourceProps<T extends object, K extends PatternDataSource> = {
    filters: tFilter[];
    factory: PatternDataSourceFactory;
    repository: tDataSourceRepository<T>;
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

export function useDataSource<T extends tParsedIndexPattern, K extends PatternDataSource>(props: tUseDataSourceProps<T, K>): tUseDataSourceLoadedReturns<K> | tUseDataSourceNotLoadedReturns {
    const { filters: defaultFilters = [], factory, repository } = props;

    if (!factory || !repository) {
        throw new Error('Factory and repository are required');
    }

    const [dataSource, setDataSource] = useState<tDataSource>();
    const [dataSourceFilterManager, setDataSourceFilterManager] = useState<PatternDataSourceFilterManager | null>(null);
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
        const dataSources = await factory.createAll(VulnerabilitiesDataSource, await repository.getAll());
        const selector = new PatternDataSourceSelector(dataSources, repository);
        const dataSource = await selector.getSelectedDataSource();
        if (!dataSource) {
            throw new Error('No valid data source found');
        }
        const dataSourceFilterManager = new PatternDataSourceFilterManager(dataSource, defaultFilters);
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