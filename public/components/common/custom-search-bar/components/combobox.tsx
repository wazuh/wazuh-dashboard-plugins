import React, { useState, useEffect, useLayoutEffect } from 'react';

import {
    EuiComboBox,
} from '@elastic/eui';

import { useValueSuggestions } from '../../hooks/use-value-suggestions'

export const Combobox = ({ item, ...props }) => {

    const { suggestedValues, isLoading, setQuery } = useValueSuggestions(item.key)

    const comboOptions = suggestedValues.map((value,key) => ({ key:key, label:value, value:item.key}))

    return (
        <EuiComboBox
            data-test-subj={`combobox-${item.key}`}
            placeholder={`Select ${item.key}`}
            className={'filters-custom-combobox'}
            options={comboOptions}
            isClearable={false}
            isLoading={isLoading}
            onSearchChange={(searchValue) => { setQuery(searchValue) }}
            {...props}
        />
    )
};