/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import {
    EuiTitle,
    EuiFlexGroup,
    EuiFlexItem,
    EuiFacetButton,
    EuiFacetGroup,
    EuiPopover,
    EuiButtonIcon,
    EuiLoadingSpinner,
    EuiContextMenu,
    EuiIcon,
} from '@elastic/eui';
import { IFilterParams, getElasticAlerts } from '../../lib';
import { getToasts } from '../../../../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

type tTacticsState = {
    tacticsList: Array<any>;
    tacticsCount: { key: string; doc_count: number }[];
    allSelected: boolean;
    isPopoverOpen: boolean;
    firstTime: boolean;
}

type tTacticsProps = {
    tacticsObject: object;
    selectedTactics: Array<any>;
    filterParams: IFilterParams;
    indexPattern: any;
    isLoading: boolean;
    onChangeSelectedTactics(selectedTactics): void;
}

export const Tactics = (props: tTacticsProps) => {
    const { filterParams, indexPattern, selectedTactics, isLoading, tacticsObject, onChangeSelectedTactics } =
        props;
    const [state, setState] = useState<tTacticsState>({
        tacticsList: [],
        tacticsCount: [],
        allSelected: false,
        isPopoverOpen: false,
        firstTime: true,
    });
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

    const { tacticsCount, isPopoverOpen } = state;
    const initTactics = () => {
        const tacticsIds = Object.keys(tacticsObject);
        const selectedTactics = {};
        tacticsIds.forEach((item, id) => {
            selectedTactics[item] = true;
        });
        onChangeSelectedTactics(selectedTactics);
    }

    useEffect(() => {
        if (isLoadingAlerts !== isLoadingAlerts) return;
        if (isLoading !== isLoading) return;
        if (JSON.stringify(filterParams) !== JSON.stringify(filterParams))
            return;
        if (JSON.stringify(indexPattern) !== JSON.stringify(indexPattern))
            return;
        if (JSON.stringify(tacticsCount) !== JSON.stringify(tacticsCount))
            return;
        if (
            JSON.stringify(selectedTactics) !==
            JSON.stringify(selectedTactics)
        )
            return;
    }, [filterParams, indexPattern, selectedTactics, isLoading, isLoadingAlerts, tacticsCount]);

    useEffect(() => {
        if (isLoading) {
            return;
        }
        getTacticsCount();
    }, [isLoading, tacticsObject]);


    const getTacticsCount = async () => {
        setIsLoadingAlerts(true);
        const { firstTime } = state;
        try {
            const { indexPattern, filterParams } = props;
            if (!indexPattern) {
                return;
            }
            const aggs = {
                tactics: {
                    terms: {
                        field: 'rule.mitre.tactic',
                        size: 1000,
                    },
                },
            };

            // TODO: use `status` and `statusText`  to show errors
            // @ts-ignore
            const { data } = await getElasticAlerts(indexPattern, filterParams, aggs);
            const buckets = data?.aggregations?.tactics?.buckets || [];
            if (firstTime) {
                initTactics(); // top tactics are checked on component mount
            }
            setState({ ...state, tacticsCount: buckets, firstTime: false });
            setIsLoadingAlerts(false);

        } catch (error) {
            const options = {
                context: `${Tactics.name}.getTacticsCount`,
                level: UI_LOGGER_LEVELS.ERROR,
                severity: UI_ERROR_SEVERITIES.BUSINESS,
                store: true,
                display: true,
                error: {
                    error: error,
                    message: error.message || error,
                    title: `Mitre alerts could not be fetched`,
                },
            };
            getErrorOrchestrator().handleError(options);
            setIsLoadingAlerts(false);
        }
    }

    const facetClicked = (id) => {
        const { selectedTactics: oldSelected, onChangeSelectedTactics } = props;
        const selectedTactics = {
            ...oldSelected,
            [id]: !oldSelected[id],
        };
        onChangeSelectedTactics(selectedTactics);
    }

    const getTacticsList = () => {
        const tacticsIds = Object.keys(tacticsObject);
        const tacticsList: Array<any> = tacticsIds.map(item => {
            const quantity =
                (tacticsCount.find(tactic => tactic.key === item) || {}).doc_count || 0;
            return {
                id: item,
                label: item,
                quantity,
                onClick: id => facetClicked(id),
            };
        });

        return (
            <>
                {tacticsList
                    .sort((a, b) => b.quantity - a.quantity)
                    .map(facet => {
                        let iconNode;
                        return (
                            <EuiFacetButton
                                key={facet.id}
                                id={`${facet.id}`}
                                quantity={facet.quantity}
                                isSelected={selectedTactics[facet.id]}
                                isLoading={isLoadingAlerts}
                                icon={iconNode}
                                onClick={
                                    facet.onClick ? () => facet.onClick(facet.id) : undefined
                                }
                            >
                                {facet.label}
                            </EuiFacetButton>
                        );
                    })}
            </>
        );
    }

    const checkAllChecked = (tacticList: any[]) => {
        let allSelected = true;
        tacticList.forEach(item => {
            if (!selectedTactics[item.id]) allSelected = false;
        });

        if (allSelected !== state.allSelected) {
            setState({ ...state, allSelected });
        }
    }

    const onCheckAllClick = () => {
        const allSelected = !state.allSelected;
        Object.keys(selectedTactics).map(item => {
            selectedTactics[item] = allSelected;
        });
        setState({ ...state, allSelected });
        onChangeSelectedTactics(selectedTactics);
    }

    const onGearButtonClick = () => {
        setState({ ...state, isPopoverOpen: !state.isPopoverOpen });
    }

    const closePopover = () => {
        setState({ ...state, isPopoverOpen: false });
    }

    const selectAll = (status) => {
        Object.keys(selectedTactics).map(item => {
            selectedTactics[item] = status;
        });
        onChangeSelectedTactics(selectedTactics);
    }

    const panels = [
        {
            id: 0,
            title: 'Options',
            items: [
                {
                    name: 'Select all',
                    icon: <EuiIcon type='check' size='m' />,
                    onClick: () => {
                        closePopover();
                        selectAll(true);
                    },
                },
                {
                    name: 'Unselect all',
                    icon: <EuiIcon type='cross' size='m' />,
                    onClick: () => {
                        closePopover();
                        selectAll(false);
                    },
                },
            ],
        },
    ];
    return (
        <div
            style={{
                backgroundColor: '#80808014',
                padding: '10px 10px 0 10px',
                height: '100%',
            }}
        >
            <EuiFlexGroup>
                <EuiFlexItem>
                    <EuiTitle size='m'>
                        <h1>Tactics</h1>
                    </EuiTitle>
                </EuiFlexItem>

                <EuiFlexItem
                    grow={false}
                    style={{ marginTop: '15px', marginRight: 8 }}
                >
                    <EuiPopover
                        button={
                            <EuiButtonIcon
                                iconType='gear'
                                onClick={() => onGearButtonClick()}
                                aria-label={'tactics options'}
                            ></EuiButtonIcon>
                        }
                        isOpen={isPopoverOpen}
                        panelPaddingSize='none'
                        closePopover={() => closePopover()}
                    >
                        <EuiContextMenu initialPanelId={0} panels={panels} />
                    </EuiPopover>
                </EuiFlexItem>
            </EuiFlexGroup>
            {isLoading ? (
                <EuiFlexItem style={{ alignItems: 'center', marginTop: 50 }}>
                    <EuiLoadingSpinner size='xl' />
                </EuiFlexItem>
            ) : (
                <EuiFacetGroup style={{}}>{getTacticsList()}</EuiFacetGroup>
            )}
        </div>
    );
}
