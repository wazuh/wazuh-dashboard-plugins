/*
 * Wazuh app - Multiple agent selector component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, useEffect, useState } from 'react';
import {
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiProgress,
  EuiSpacer,
  EuiButton,
  EuiButtonIcon,
  EuiBadge,
  EuiTitle,
  EuiLoadingSpinner,
  EuiFieldSearch,
  EuiKeyPadMenu,
  EuiKeyPadMenuItem,
  EuiIcon,
} from '@elastic/eui';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzRequest } from '../../../react-services/wz-request';
import './multiple-agent-selector.scss';
import $ from 'jquery';
import { WzFieldSearchDelay } from '../../common/search';
import { withErrorBoundary } from '../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { Logtest } from '../../../directives/wz-logtest/components/logtest';

export const MultipleAgentSelector = withErrorBoundary(
  class MultipleAgentSelector extends Component {
    constructor(props) {
      super(props);
      this.state = {
        previousAvailableAgents: {},
        previousSelectedAgents: {},
        availableAgents: {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false,
        },
        selectedAgents: {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false,
        },
        availableItem: [],
        selectedElement: [],
        firstSelectedList: [],
        selectedFilter: '',
        availableFilter: '',
        currentAdding: 0,
        currentDeleting: 0,
        moreThan500: false,
        load: false,
        savingChanges: false,
        initState: true,
        typedClasses: {
          a: 'wzMultipleSelectorAdding',
          r: 'wzMultipleSelectorRemoving',
        },
      };
    }

    clearAgents() {
      this.setState({
        currentAdding: 0,
        currentDeleting: 0,
        availableAgents: {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false,
        },
        selectedAgents: {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false,
        },
      });
    }

    async componentDidMount() {
      this.setState({ load: true });

      try {
        while (!this.state.selectedAgents.loadedAll) {
          await this.loadSelectedAgents();
          this.setState({
            selectedAgents: {
              ...this.state.selectedAgents,
              offset: this.state.selectedAgents.offset + 499,
            },
          });
        }
        this.firstSelectedList = [...this.state.selectedAgents.data];
        await this.loadAllAgents('', true);

        this.setState({ load: false });
      } catch (error) {
        const options = {
          context: `${MultipleAgentSelector.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: 'Error loading agents',
          },
        };
        getErrorOrchestrator().handleError(options);
        this.setState({ load: false });
      }
    }

    async loadAllAgents(searchTerm, start) {
      try {
        const params = {
          offset: !start ? this.state.availableAgents.offset : 0,
          select: ['id', 'name'].toString(),
        };

        if (searchTerm) {
          params.search = searchTerm;
        }

        const req = await WzRequest.apiReq('GET', '/agents', {
          params: params,
        });

        const totalAgents = req.data.data.total_affected_items;

        const mapped = req.data.data.affected_items
          .filter((item) => {
            return (
              this.state.selectedAgents.data.filter((selected) => {
                return selected.key == item.id;
              }).length == 0 && item.id !== '000'
            );
          })
          .map((item) => {
            return { key: item.id, value: item.name };
          });
        if (start) {
          this.setState({
            availableAgents: {
              ...this.state.availableAgents,
              data: mapped,
            },
          });
        } else {
          this.setState({
            availableAgents: {
              ...this.state.availableAgents,
              data: (this.state.availableAgents.data || []).concat(mapped),
            },
          });
        }

        if (this.state.availableAgents.data.length < 10 && !searchTerm) {
          if (this.state.availableAgents.offset >= totalAgents) {
            this.setState({
              availableAgents: {
                ...this.state.availableAgents,
                loadedAll: true,
              },
            });
          }
          if (!this.state.availableAgents.loadedAll) {
            this.setState({
              availableAgents: {
                ...this.state.availableAgents,
                offset: this.state.availableAgents.offset + 499,
              },
            });
            await this.loadAllAgents(searchTerm);
          }
        }
      } catch (error) {
        throw new Error('Error fetching all available agents');
      }
    }

    async loadSelectedAgents(searchTerm) {
      try {
        let params = {
          offset: !searchTerm ? this.state.selectedAgents.offset : 0,
          select: ['id', 'name'].toString(),
        };
        if (searchTerm) {
          params.search = searchTerm;
        }
        const result = await WzRequest.apiReq(
          'GET',
          `/groups/${this.props.currentGroup.name}/agents`,
          {
            params,
          }
        );
        this.setState({ totalSelectedAgents: result.data.data.total_affected_items });
        const mapped = result.data.data.affected_items.map((item) => {
          return { key: item.id, value: item.name };
        });
        this.firstSelectedList = mapped;
        if (searchTerm) {
          this.setState({
            selectedAgents: {
              ...this.state.selectedAgents,
              data: mapped,
              loadedAll: true,
            },
          });
        } else {
          this.setState({
            selectedAgents: {
              ...this.state.selectedAgents,
              data: (this.state.selectedAgents.data || []).concat(mapped),
            },
          });
        }
        if (
          this.state.selectedAgents.data.length === 0 ||
          this.state.selectedAgents.data.length < 500 ||
          this.state.selectedAgents.offset >= this.state.totalSelectedAgents
        ) {
          this.setState({
            selectedAgents: {
              ...this.state.selectedAgents,
              loadedAll: true,
            },
          });
        }
      } catch (error) {
        throw new Error('Error fetching group agents');
      }
      this.setState({
        selectedAgents: {
          ...this.state.selectedAgents,
          loaded: true,
        },
      });
    }

    getItemsToSave() {
      const original = this.firstSelectedList;
      const modified = this.state.selectedAgents.data;
      const deletedAgents = [];
      const addedAgents = [];

      modified.forEach((mod) => {
        if (original.filter((e) => e.key === mod.key).length === 0) {
          addedAgents.push(mod);
        }
      });
      original.forEach((orig) => {
        if (modified.filter((e) => e.key === orig.key).length === 0) {
          deletedAgents.push(orig);
        }
      });

      const addedIds = [...new Set(addedAgents.map((x) => x.key))];
      const deletedIds = [...new Set(deletedAgents.map((x) => x.key))];

      return { addedIds, deletedIds };
    }

    groupBy(collection, property) {
      try {
        const values = [];
        const result = [];

        for (const item of collection) {
          const index = values.indexOf(item[property]);
          if (index > -1) result[index].push(item);
          else {
            values.push(item[property]);
            result.push([item]);
          }
        }
        return result.length ? result : false;
      } catch (error) {
        return false;
      }
    }

    async saveAddAgents() {
      const itemsToSave = this.getItemsToSave();
      try {
        this.setState({ savingChanges: true, initState: false });
        if (itemsToSave.addedIds.length) {
          await WzRequest.apiReq('PUT', `/agents/group`, {
            params: {
              group_id: this.props.currentGroup.name,
              agents_list: itemsToSave.addedIds.toString(),
            },
          });
        }

        if (itemsToSave.deletedIds.length) {
          await WzRequest.apiReq('DELETE', `/agents/group`, {
            params: {
              group_id: this.props.currentGroup.name,
              agents_list: itemsToSave.deletedIds.toString(),
            },
          });
        }

        this.setState({ savingChanges: false, initState: true });
        ErrorHandler.info('Group has been updated');
        this.clearAgents();
        await this.componentDidMount();
      } catch (error) {
        this.setState({ savingChanges: false, initState: true });

        this.clearAgents();
        await this.componentDidMount();

        const options = {
          context: `${MultipleAgentSelector.name}.saveAddAgents`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: {
              message: error,
              stack: error,
            },
            message: error.message || error,
            title: error.name,
          },
        };

        getErrorOrchestrator().handleError(options);
      }
      return;
    }

    clearFailedErrors() {
      this.failedErrors = false;
    }

    checkLimit() {
      if (this.firstSelectedList) {
        const itemsToSave = this.getItemsToSave();
        const currentAdding = itemsToSave.addedIds.length;
        const currentDeleting = itemsToSave.deletedIds.length;
        this.setState({
          currentAdding,
          currentDeleting,
          moreThan500: currentAdding > 500 || currentDeleting > 500,
        });
      }
    }

    moveItem = (item, from, to, type) => {
      if (Array.isArray(item)) {
        item.forEach((elem) => this.moveItem(elem, from, to, type));
        this.checkLimit();
      } else {
        item = JSON.parse(item);
        const idx = from.findIndex((x) => x.key === item.key);
        if (idx !== -1) {
          from.splice(idx, 1);
          item.type = !item.type ? type : '';
          to.push(item);
        }
      }
      $('#wzMultipleSelectorLeft').val('');
      $('#wzMultipleSelectorRight').val('');
    };

    moveAll = (from, to, type) => {
      from.forEach((item) => {
        item.type = !item.type ? type : '';
        to.push(item);
      });
      from.length = 0;
      this.checkLimit();
    };

    sort = (a) => {
      return parseInt(a.key);
    };

    unselectElementsOfSelectByID(containerID) {
      Array.from(document.getElementById(containerID).options).forEach((option) => {
        option.selected = false;
      });
    }

    async reload(element, searchTerm, start = false, addOffset = 0) {
      if (element === 'left') {
        const callbackLoadAgents = async () => {
          try {
            await this.loadAllAgents(searchTerm, start);
          } catch (error) {
            const options = {
              context: `${MultipleAgentSelector.name}.reload`,
              level: UI_LOGGER_LEVELS.ERROR,
              severity: UI_ERROR_SEVERITIES.BUSINESS,
              error: {
                error: error,
                message: error.message || error,
                title: 'Error fetching all available agents',
              },
            };
            getErrorOrchestrator().handleError(options);
          }
        };
        if (!this.state.availableAgents.loadedAll) {
          if (start) {
            this.setState(
              {
                availableAgents: {
                  ...this.state.availableAgents,
                  offset: 0,
                },
                selectedAgents: {
                  ...this.state.selectedAgents,
                  offset: 0,
                },
              },
              callbackLoadAgents
            );
          } else {
            this.setState(
              {
                availableAgents: {
                  ...this.state.availableAgents,
                  offset: this.state.availableAgents.offset + 500,
                },
              },
              callbackLoadAgents
            );
          }
        } else {
          callbackLoadAgents();
        }
      } else {
        if (!this.state.selectedAgents.loadedAll) {
          this.setState({
            selectedAgents: {
              ...this.state.selectedAgents,
              offset: this.state.selectedAgents.offset + addOffset + 1,
            },
          });
          try {
            await this.loadSelectedAgents(searchTerm);
          } catch (error) {
            const options = {
              context: `${MultipleAgentSelector.name}.reload`,
              level: UI_LOGGER_LEVELS.ERROR,
              severity: UI_ERROR_SEVERITIES.BUSINESS,
              error: {
                error: error,
                message: error.message || error,
                title: 'Error fetching group agents',
              },
            };
            getErrorOrchestrator().handleError(options);
          }
        }
      }
    }

    scrollList = async (target) => {
      if (target === 'left') {
        await this.reload('left', this.state.availableFilter, false);
      } else {
        await this.reload('right', this.state.selectedFilter, false);
      }
    };

    render() {
      return (
        <EuiPage style={{ background: 'transparent' }}>
          <EuiFlexGroup>
            <EuiFlexItem>
              {this.state.load && (
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiProgress size="xs" color="primary"></EuiProgress>
                    <EuiSpacer size="l"></EuiSpacer>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
              {!this.state.load && (
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiPanel>
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiFlexGroup>
                            <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
                              <EuiButtonIcon
                                aria-label="Back"
                                style={{ paddingTop: 8 }}
                                color="primary"
                                iconSize="l"
                                iconType="arrowLeft"
                                onClick={() => this.props.cancelButton()}
                              />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiTitle size="m">
                                <h1>Manage agents of group {this.props.currentGroup.name}</h1>
                              </EuiTitle>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem></EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          {!this.state.moreThan500 && (
                            <EuiButton
                              fill
                              onClick={() => this.saveAddAgents()}
                              isLoading={this.state.savingChanges}
                              isDisabled={
                                this.state.initState ||
                                (this.state.currentDeleting === 0 && this.state.currentAdding === 0)
                              }
                            >
                              Apply changes
                            </EuiButton>
                          )}
                          {this.state.moreThan500 && (
                            <span className="error-msg">
                              <i className="fa fa-exclamation-triangle"></i>
                              &nbsp;Changes cannot be applied with more than 500 additions or
                              removals
                            </span>
                          )}
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiFlexGroup>
                        <EuiFlexItem style={{ marginTop: 30 }}>
                          <div id="wzMultipleSelector">
                            <div className="wzMultipleSelectorLeft">
                              <EuiPanel paddingSize="m">
                                <EuiFlexGroup>
                                  <EuiFlexItem>
                                    <EuiTitle size="s">
                                      <h4>Available agents</h4>
                                    </EuiTitle>
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}>
                                    <EuiButtonIcon
                                      aria-label="Back"
                                      color="primary"
                                      iconType="refresh"
                                      onClick={() =>
                                        this.reload('left', this.state.availableFilter, true)
                                      }
                                    />
                                  </EuiFlexItem>
                                  {/*)} */}
                                </EuiFlexGroup>
                                <EuiSpacer size={'s'}></EuiSpacer>
                                <WzFieldSearchDelay
                                  placeholder="Filter..."
                                  onChange={(searchValue) => {
                                    this.setState({
                                      availableFilter: searchValue,
                                      availableItem: [],
                                    });
                                  }}
                                  onSearch={async (searchValue) => {
                                    await this.reload('left', searchValue, true);
                                  }}
                                  isClearable={true}
                                  fullWidth={true}
                                  aria-label="Filter"
                                />
                                <EuiSpacer size={'m'}></EuiSpacer>
                                <select
                                  id="wzMultipleSelectorLeft"
                                  size="15"
                                  multiple
                                  onChange={(e) => {
                                    this.unselectElementsOfSelectByID('wzMultipleSelectorRight');
                                    this.setState(
                                      {
                                        availableItem: Array.from(
                                          e.target.selectedOptions,
                                          (option) => option.value
                                        ),
                                        selectedElement: [],
                                      },
                                      () => {
                                        this.checkLimit();
                                      }
                                    );
                                  }}
                                  className="wzMultipleSelectorSelect"
                                  onDoubleClick={() => {
                                    this.moveItem(
                                      this.state.availableItem,
                                      this.state.availableAgents.data,
                                      this.state.selectedAgents.data,
                                      'a'
                                    );
                                    this.setState({ availableItem: [], initState: false });
                                  }}
                                >
                                  {this.state.availableAgents.data
                                    .sort(this.sort)
                                    .map((item, index) => (
                                      <option
                                        key={index}
                                        className={this.state.typedClasses[item.type]}
                                        value={JSON.stringify(item)}
                                      >
                                        {`${item.key} - ${item.value}`}
                                      </option>
                                    ))}
                                </select>
                                {(!this.state.availableAgents.loadedAll &&
                                  !this.state.loadingAvailableAgents && (
                                    <>
                                      <EuiSpacer size="m" />
                                      <p
                                        className="wz-load-extra"
                                        onClick={() => {
                                          this.setState(
                                            { loadingAvailableAgents: true },
                                            async () => {
                                              await this.scrollList('left');
                                              this.setState({ loadingAvailableAgents: false });
                                            }
                                          );
                                        }}
                                      >
                                        {' '}
                                        <EuiIcon type="refresh" /> &nbsp; Click here to load more
                                        agents
                                      </p>
                                    </>
                                  )) ||
                                  (this.state.loadingAvailableAgents && (
                                    <>
                                      <EuiSpacer size="m" />
                                      <p className="wz-load-extra">
                                        {' '}
                                        <EuiLoadingSpinner size="m" /> &nbsp; Loading...
                                      </p>
                                    </>
                                  ))}
                              </EuiPanel>
                            </div>
                            <EuiKeyPadMenu className="wzMultipleSelectorButtons">
                              <EuiKeyPadMenuItem
                                label="Add all items"
                                onClick={() => {
                                  this.moveAll(
                                    this.state.availableAgents.data,
                                    this.state.selectedAgents.data,
                                    'a'
                                  );
                                  this.setState(
                                    { availableItem: [], availableFilter: '', initState: false },
                                    () => {
                                      this.reload('left', this.state.availableFilter, true);
                                    }
                                  );
                                }}
                                isDisabled={
                                  this.state.availableAgents.data.length === 0 ||
                                  this.state.availableAgents.data.length > 500
                                }
                              >
                                <EuiIcon type="editorRedo" color={'primary'} size="l" />
                              </EuiKeyPadMenuItem>
                              <EuiKeyPadMenuItem
                                label="Add selected items"
                                onClick={() => {
                                  this.moveItem(
                                    this.state.availableItem,
                                    this.state.availableAgents.data,
                                    this.state.selectedAgents.data,
                                    'a'
                                  );
                                  this.setState({
                                    availableItem: [],
                                    availableFilter: '',
                                    initState: false,
                                  });
                                }}
                                isDisabled={
                                  !this.state.availableItem.length ||
                                  this.state.availableItem.length > 500
                                }
                              >
                                <EuiIcon type="arrowRight" color={'primary'} size="l" />
                              </EuiKeyPadMenuItem>
                              <EuiKeyPadMenuItem
                                label="Remove selected items"
                                onClick={() => {
                                  this.moveItem(
                                    this.state.selectedElement,
                                    this.state.selectedAgents.data,
                                    this.state.availableAgents.data,
                                    'r'
                                  );
                                  this.setState({
                                    selectedFilter: '',
                                    selectedElement: [],
                                    initState: false,
                                  });
                                }}
                                isDisabled={
                                  !this.state.selectedElement.length ||
                                  this.state.selectedElement.length > 500
                                }
                              >
                                <EuiIcon type="arrowLeft" color={'primary'} size="l" />
                              </EuiKeyPadMenuItem>
                              <EuiKeyPadMenuItem
                                label="Remove all items"
                                onClick={() => {
                                  this.moveAll(
                                    this.state.selectedAgents.data,
                                    this.state.availableAgents.data,
                                    'r'
                                  );
                                  this.setState(
                                    { selectedElement: [], selectedFilter: '', initState: false },
                                    () => {
                                      this.reload('right');
                                    }
                                  );
                                }}
                                isDisabled={
                                  this.state.selectedAgents.data.length === 0 ||
                                  this.state.selectedAgents.data.length > 500
                                }
                              >
                                <EuiIcon type="editorUndo" color={'primary'} size="l" />
                              </EuiKeyPadMenuItem>
                            </EuiKeyPadMenu>
                            <div className="wzMultipleSelectorRight">
                              <EuiPanel paddingSize="m">
                                <EuiFlexGroup>
                                  <EuiFlexItem>
                                    <EuiTitle size="s">
                                      <h4>
                                        Current agents in the group (
                                        {this.state.totalSelectedAgents})
                                      </h4>
                                    </EuiTitle>
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
                                    <EuiBadge color={'#017D73'}>
                                      Added: {this.state.currentAdding}
                                    </EuiBadge>
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}>
                                    <EuiBadge color={'#BD271E'}>
                                      Removed: {this.state.currentDeleting}
                                    </EuiBadge>
                                  </EuiFlexItem>
                                </EuiFlexGroup>
                                <EuiSpacer size={'s'}></EuiSpacer>
                                <EuiFieldSearch
                                  placeholder="Filter..."
                                  onChange={(ev) =>
                                    this.setState({
                                      selectedFilter: ev.target.value,
                                      selectedElement: [],
                                    })
                                  }
                                  onSearch={(value) => {
                                    this.setState({ selectedFilter: value });
                                  }}
                                  isClearable={true}
                                  fullWidth={true}
                                  aria-label="Filter"
                                />
                                <EuiSpacer size={'m'}></EuiSpacer>
                                <select
                                  id="wzMultipleSelectorRight"
                                  size="15"
                                  multiple
                                  onChange={(e) => {
                                    this.unselectElementsOfSelectByID('wzMultipleSelectorLeft');
                                    this.setState(
                                      {
                                        selectedElement: Array.from(
                                          e.target.selectedOptions,
                                          (option) => option.value
                                        ),
                                        availableItem: [],
                                      },
                                      () => {
                                        this.checkLimit();
                                      }
                                    );
                                  }}
                                  className="wzMultipleSelectorSelect"
                                  onDoubleClick={(e) => {
                                    this.moveItem(
                                      this.state.selectedElement,
                                      this.state.selectedAgents.data,
                                      this.state.availableAgents.data,
                                      'r'
                                    );
                                    this.setState({ selectedElement: [], initState: false });
                                  }}
                                >
                                  {this.state.selectedAgents.data
                                    .filter(
                                      (x) =>
                                        !this.state.selectedFilter ||
                                        x.key.includes(this.state.selectedFilter) ||
                                        x.value.includes(this.state.selectedFilter)
                                    )
                                    .sort(this.sort)
                                    .map((item, index) => (
                                      <option
                                        key={index}
                                        className={this.state.typedClasses[item.type]}
                                        value={JSON.stringify(item)}
                                      >
                                        {`${item.key} - ${item.value}`}
                                      </option>
                                    ))}
                                </select>
                              </EuiPanel>
                            </div>
                          </div>
                          <EuiSpacer size={'l'}></EuiSpacer>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPage>
      );
    }
  }
);
