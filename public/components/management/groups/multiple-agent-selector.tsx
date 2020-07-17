import React, { Component, Fragment } from 'react';
import { EuiPage, EuiPanel, EuiFlexGroup, EuiFlexItem, EuiProgress, EuiSpacer, EuiButton, EuiTitle, EuiFieldSearch, EuiKeyPadMenu, EuiKeyPadMenuItem, EuiIcon, EuiSelect } from '@elastic/eui';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzRequest } from '../../../react-services/wz-request';
import $ from 'jquery';

export class MultipleAgentSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      availableAgents: {
        loaded: false,
        data: [],
        offset: 0,
        loadedAll: false
      },
      selectedAgents: {
        loaded: false,
        data: [],
        offset: 0,
        loadedAll: false
      },
      availableItem: [],
      selectedElement: [],
      selectedFilter: '',
      currentAdding: 0,
      currentDeleting: 0,
      moreThan500: false,
      load: false,
      multipleSelectorLoading: false
    };
  }

  async componentDidMount() {
    $('#wzMultipleSelector select').scroll((ev) => {
      this.scrollList(ev.currentTarget);
    });
    this.setState({ load: true });
    try {
      this.setState({ multipleSelectorLoading: true });
      while (!this.state.selectedAgents.loadedAll) {
        await this.loadSelectedAgents();
        this.setState({
          availableAgents: {
            ...this.state.availableAgents,
            offset: this.state.availableAgents.offset + 499,
          }
        })
      }
      this.firstSelectedList = [...this.state.selectedAgents.data];
      await this.loadAllAgents("", true);
      this.setState({
        load: false,
        multipleSelectorLoading: false
      });
    } catch (error) {
      ErrorHandler.handle(error, 'Error adding agents');
    }
  }

  async loadAllAgents(searchTerm, start) {
    try {
      const params = {
        limit: 500,
        offset: !start ? this.state.availableAgents.offset : 0,
        select: ['id', 'name']
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const req = await WzRequest.apiReq('GET', '/agents', params);

      this.totalAgents = req.data.data.totalItems;

      const mapped = req.data.data.items
        .filter(item => {
          return (
            this.state.selectedAgents.data.filter(selected => {
              return selected.key == item.id;
            }).length == 0 && item.id !== '000'
          );
        })
        .map(item => {
          return { key: item.id, value: item.name };
        });
      if (start) {
        this.setState({
          availableAgents: {
            ...this.state.availableAgents,
            data: mapped,
          }
        })
      } else {
        this.setState({
          availableAgents: {
            ...this.state.availableAgents,
            data: (this.state.availableAgents.data || []).concat(mapped)
          }
        })
      }

      if (this.state.availableAgents.data.length < 10 && !searchTerm) {
        if (this.state.availableAgents.offset >= this.totalAgents) {
          this.setState({
            availableAgents: {
              ...this.state.availableAgents,
              loadedAll: true,
            }
          })
        }
        if (!this.state.availableAgents.loadedAll) {
          this.setState({
            availableAgents: {
              ...this.state.availableAgents,
              offset: this.state.availableAgents.offset + 499,
            }
          })
          await this.loadAllAgents(searchTerm);
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Error fetching all available agents');
    }
  }

  async loadSelectedAgents(searchTerm) {
    try {
      let params = {
        offset: !searchTerm ? this.state.selectedAgents.offset : 0,
        select: ['id', 'name']
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const result = await WzRequest.apiReq(
        'GET',
        `/agents/groups/${this.props.currentGroup.name}`,
        params
      );
      this.setState({ totalSelectedAgents: result.data.data.totalItems })
      const mapped = result.data.data.items.map(item => {
        return { key: item.id, value: item.name };
      });
      this.firstSelectedList = mapped;
      if (searchTerm) {
        this.setState({
          selectedAgents: {
            ...this.state.selectedAgents,
            data: mapped,
            loadedAll: true
          }
        });
      } else {
        this.setState({
          selectedAgents: {
            ...this.state.selectedAgents,
            data: (this.state.selectedAgents.data || []).concat(mapped)
          }
        })
      }
      if (
        this.state.selectedAgents.data.length === 0 ||
        this.state.selectedAgents.data.length < 500 ||
        this.state.selectedAgents.offset >= this.state.totalSelectedAgents
      ) {
        this.setState({
          selectedAgents: {
            ...this.state.selectedAgents,
            loadedAll: true
          }
        })
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Error fetching group agents');
    }
    this.setState({
      selectedAgents: {
        ...this.state.selectedAgents,
        loaded: true
      }
    })
  }

  getItemsToSave() {
    const original = this.firstSelectedList;
    const modified = this.state.selectedAgents.data;
    this.deletedAgents = [];
    this.addedAgents = [];

    modified.forEach(mod => {
      if (original.filter(e => e.key === mod.key).length === 0) {
        this.addedAgents.push(mod);
      }
    });
    original.forEach(orig => {
      if (modified.filter(e => e.key === orig.key).length === 0) {
        this.deletedAgents.push(orig);
      }
    });

    const addedIds = [...new Set(this.addedAgents.map(x => x.key))];
    const deletedIds = [...new Set(this.deletedAgents.map(x => x.key))];

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
    const failedIds = [];
    try {
      this.setState({ multipleSelectorLoading: true });
      if (itemsToSave.addedIds.length) {
        const addResponse = await WzRequest.apiReq(
          'POST',
          `/agents/group/${this.props.currentGroup.name}`,
          { ids: itemsToSave.addedIds }
        );
        if (addResponse.data.data.failed_ids) {
          failedIds.push(...addResponse.data.data.failed_ids);
        }
      }
      if (itemsToSave.deletedIds.length) {
        const deleteResponse = await WzRequest.apiReq(
          'DELETE',
          `/agents/group/${this.props.currentGroup.name}`,
          { ids: itemsToSave.deletedIds.toString() }
        );
        if (deleteResponse.data.data.failed_ids) {
          failedIds.push(...deleteResponse.data.data.failed_ids);
        }
      }

      if (failedIds.length) {
        const failedErrors = failedIds.map(item => ({
          id: (item || {}).id,
          message: ((item || {}).error || {}).message
        }));
        this.failedErrors = this.groupBy(failedErrors, 'message') || false;
        ErrorHandler.info(
          `Group has been updated but an error has occurred with ${failedIds.length} agents`,
          '',
          { warning: true }
        );
      } else {
        ErrorHandler.info('Group has been updated');
      }
      this.setState({ multipleSelectorLoading: false });
      this.props.cancelButton();
    } catch (err) {
      this.setState({ multipleSelectorLoading: false });
      ErrorHandler.handle(err, 'Error applying changes');
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
        moreThan500: currentAdding > 500 || currentDeleting > 500
      })
    }
  }

  moveItem = (item, from, to, type) => {
    if (Array.isArray(item)) {
      item.forEach(elem => this.moveItem(elem, from, to, type));
      this.checkLimit();
    } else {
      item = JSON.parse(item);
      const idx = from.findIndex(x => x.key === item.key);
      if (idx !== -1) {
        from.splice(idx, 1);
        item.type = !item.type ? type : '';
        to.push(item)
      }
    }
  };

  moveAll = (from, to, type) => {
    from.forEach(item => {
      item.type = !item.type ? type : '';
      to.push(item);
    });
    from.length = 0;
    this.checkLimit();
  };

  sort = a => {
    return parseInt(a.key);
  };

  async reload(element, searchTerm, start = false, addOffset) {
    if (element === 'left') {
      if (!this.state.availableAgents.loadedAll) {
        this.setState({ multipleSelectorLoading: true });
        if (start) {
          this.setState({
            availableAgents: {
              ...this.state.availableAgents,
              offset: 0,
            },
            selectedAgents: {
              ...this.state.availableAgents,
              offset: 0,
            }
          })
        } else {
          this.setState({
            availableAgents: {
              ...this.state.availableAgents,
              offset: this.state.availableAgents.offset + 500,
            }
          })
        }
        try {
          await this.loadAllAgents(searchTerm, start);
        } catch (error) {
          this.errorHandler.handle(error, 'Error fetching all available agents');
        }
      }
    } else {
      if (!this.state.selectedAgents.loadedAll) {
        this.setState(
          { multipleSelectorLoading: true },
          {
            selectedAgents: {
              ...this.state.selectedAgents,
              offset: this.state.selectedAgents.offset + addOffset + 1,
            }
          });
        try {
          await this.loadSelectedAgents(searchTerm);
        } catch (error) {
          this.errorHandler.handle(error, 'Error fetching all selected agents');
        }
      }
    }
    this.setState({ multipleSelectorLoading: false });
  }

  scrollList = (target) => {
    const pos = target.scrollTop + target.offsetHeight;
    const max = target.scrollHeight;
    if (pos >= max) {
      target.parentElement.parentElement.parentElement.className ===
        'wzMultipleSelectorLeft'
        ? this.reload('left', this.state.availableFilter, false)
        : this.reload('right', this.state.selectedFilter, false);
    }
  };

  render() {
    let selectedFilter = '';
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiFlexGroup>
          <EuiFlexItem>
            {this.state.load && (
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiProgress size='xs' color='primary'></EuiProgress>
                  <EuiSpacer size='l'></EuiSpacer>
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
                          <EuiFlexItem grow={false}>
                            <EuiButton onClick={() => this.props.cancelButton()} iconType="arrowLeft">
                              Back
                          </EuiButton>
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
                          <EuiButton fill onClick={() => this.saveAddAgents()}
                            isDisabled={this.state.currentDeleting === 0 && this.state.currentAdding === 0}>
                            Apply changes
                          </EuiButton>
                        )}
                        {this.state.moreThan500 && (
                          <span className='error-msg'><i class="fa fa-exclamation-triangle"></i>
                          It is not possible to apply changes of more than 500 additions or deletions
                          </span>
                        )}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiFlexGroup>
                      <EuiFlexItem style={{ marginTop: 30 }}>
                        {!this.multipleSelectorLoading && (
                          <span className="wzMultipleSelectorCounter">
                            <span style={{ color: 'green' }}>+{this.state.currentAdding}</span>&nbsp;
                            <span style={{ color: 'red' }}>-{this.state.currentDeleting}</span>
                          </span>
                        )}
                        <div id='wzMultipleSelector'>
                          <div className='wzMultipleSelectorLeft'>
                            <EuiPanel paddingSize="m">
                              <EuiTitle size="s">
                                <h4>Available agents</h4>
                              </EuiTitle>
                              <EuiSpacer size={"s"}></EuiSpacer>
                              {/* {!this.state.selectedAgents.loadedAll && ( */}
                              <span onClick={() => this.reload("left", this.state.availableFilter, true)} className='pull-right cursor-pointer'>
                                <span className='fa fa-refresh' aria-hidden='true'></span>
                              </span>
                              {/* )} */}
                              <EuiFieldSearch
                                placeholder="Filter..."
                                onChange={(ev) => {
                                  this.setState({ availableFilter: ev.target.value, availableItem: [] });
                                }}
                                onSearch={value => {
                                  this.setState({ availableFilter: value });
                                  this.reload("left", this.state.availableFilter, true)
                                }}
                                isClearable={true}
                                fullWidth={true}
                                aria-label="Use aria labels when no actual label is in useFilter"
                              />
                              <EuiSpacer size={"m"}></EuiSpacer>
                              <select
                                size='15'
                                multiple
                                onChange={(e) => {
                                  this.setState({
                                    availableItem: Array.from(e.target.selectedOptions, option => option.value),
                                    selectedElement: []
                                  }, this.checkLimit());
                                }}
                                style={{ width: '100%', backgroundColor: '#fbfcfd', border: '1px solid #D3DAE6' }}
                                onDoubleClick={() => {
                                  this.moveItem(this.state.availableItem, this.state.availableAgents.data, this.state.selectedAgents.data, "a");
                                  this.setState({ availableItem: [] });
                                }}>
                                {this.state.availableAgents.data.sort(this.sort).map((item, index) => (
                                  <option
                                    key={index}
                                    className={
                                      item.type === 'a' ? 'wzMultipleSelectorAdding' : item.type === 'r' ? 'wzMultipleSelectorRemoving' : ''}
                                    value={JSON.stringify(item)}>{`${item.key} - ${item.value}`}
                                  </option>
                                ))}
                              </select>
                            </EuiPanel>
                          </div>
                          <EuiKeyPadMenu className="wzMultipleSelectorButtons">
                            <EuiKeyPadMenuItem
                              label="Add all items"
                              onClick={() => {
                                this.moveAll(this.state.availableAgents.data, this.state.selectedAgents.data, "a");
                                this.setState({ availableItem: [], availableFilter: '' });
                                this.reload("left", this.state.availableFilter, true)
                              }}
                              isDisabled={this.state.availableAgents.data.length === 0 || this.state.availableAgents.data.length > 500}
                            >
                              <EuiIcon type="editorRedo" size="l" />
                            </EuiKeyPadMenuItem>
                            <EuiKeyPadMenuItem
                              label="Add selected items"
                              onClick={() => {
                                this.moveItem(this.state.availableItem, this.state.availableAgents.data, this.state.selectedAgents.data, "a");
                                this.setState({ availableItem: [], availableFilter: '' });
                              }}
                              isDisabled={!this.state.availableItem.length || this.state.availableItem.length > 500}
                            >
                              <EuiIcon type="arrowRight" size="l" />
                            </EuiKeyPadMenuItem>
                            <EuiKeyPadMenuItem
                              label="Remove selected items"
                              onClick={() => {
                                this.moveItem(this.state.selectedElement, this.state.selectedAgents.data, this.state.availableAgents.data, "r");
                                this.setState({ selectedFilter: "", selectedElement: [] });
                              }}
                              isDisabled={!this.state.selectedElement.length || this.state.selectedElement.length > 500}
                            >
                              <EuiIcon type="arrowLeft" size="l" />
                            </EuiKeyPadMenuItem>
                            <EuiKeyPadMenuItem
                              label="Remove all items"
                              onClick={() => {
                                this.moveAll(this.state.selectedAgents.data, this.state.availableAgents.data, "r");
                                this.setState({ selectedElement: [], selectedFilter: "" });
                                this.reload("right")
                              }}
                              isDisabled={!this.state.selectedAgents.data.length === 0 || this.state.selectedAgents.data.length > 500}
                            >
                              <EuiIcon type="editorUndo" size="l" />
                            </EuiKeyPadMenuItem>
                          </EuiKeyPadMenu>
                          <div className='wzMultipleSelectorRight'>
                            <EuiPanel paddingSize="m">
                              <EuiTitle size="s">
                                <h4>Current agents in the group ({this.state.totalSelectedAgents})</h4>
                              </EuiTitle>
                              <EuiSpacer size={"s"}></EuiSpacer>
                              <EuiFieldSearch
                                placeholder="Filter..."
                                onChange={(ev) => this.setState({ selectedFilter: ev.target.value, selectedElement: [] })}
                                onSearch={value => { this.setState({ selectedFilter: value }) }}
                                isClearable={true}
                                fullWidth={true}
                                aria-label="Filter"
                              />
                              <EuiSpacer size={"m"}></EuiSpacer>
                              <select
                                size='15'
                                multiple
                                onChange={(e) => {
                                  this.setState({
                                    selectedElement: Array.from(e.target.selectedOptions, option => option.value),
                                    availableItem: []
                                  }, this.checkLimit());
                                }}
                                style={{ width: '100%', backgroundColor: '#fbfcfd', border: '1px solid #D3DAE6' }}
                                onDoubleClick={(e) => {
                                  this.moveItem(this.state.selectedElement, this.state.selectedAgents.data, this.state.availableAgents.data, "r");
                                  this.setState({ selectedElement: [] });
                                }}>
                                {this.state.selectedAgents.data
                                  .filter(x => !this.state.selectedFilter || x.key.includes(this.state.selectedFilter) || x.value.includes(this.state.selectedFilter))
                                  .sort(this.sort)
                                  .map((item, index) => (
                                    <option
                                      key={index}
                                      className={
                                        item.type === 'a' ? 'wzMultipleSelectorAdding' : item.type === 'r' ? 'wzMultipleSelectorRemoving' : ''}
                                      value={JSON.stringify(item)}>{`${item.key} - ${item.value}`}
                                    </option>
                                  ))}
                              </select>
                              {/*<select size='10' multiple ng-model='selectedElement' ng-change='availableItem=null;this.checkLimit()'
                                  className='width-100'
                                  ng-dblclick='moveItem(selectedElement, selectedItems, availableItems, "r");selectedElement=null'>
                                  <option ng-repeat='item in selectedItems | filter: selectedFilter | orderBy:sort'
                                    ng-class="item.type === 'a' ? 'wzMultipleSelectorAdding' : item.type === 'r' ? 'wzMultipleSelectorRemoving' : ''"
                                    ng-value="{{item}}">{ {{ item.key + " - " + item.value }}}</option>
                                </select> */}
                            </EuiPanel>
                          </div>
                        </div>
                        <EuiSpacer size={"l"}></EuiSpacer>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage >
    );
  }
};
