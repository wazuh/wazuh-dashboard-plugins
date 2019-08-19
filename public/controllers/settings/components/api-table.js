import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTable,
  EuiPanel,
  EuiButtonIcon,
  EuiToolTip,
  EuiFormRow,
  EuiFieldText,
  EuiFieldPassword,
  EuiFieldNumber,
  EuiButton,
  EuiSpacer,
  EuiButtonEmpty
} from '@elastic/eui';

export class ApiTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemIdToExpandedRowMap: {},
      user: '',
      password: '',
      url: '',
      port: 55000,
      apiEntries: [],
      currentDefault: 0
    };

    this.editionEnabled = false;
  }


  async getHostsInconfig() {
    try {
      const result = await this.props.getApisInRegistry();
      return result.data || [];
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Binds the cluster info to the API entries
   */
  async bindClusterInfo() {
    try {
      if (this.editionEnabled) return;
      const hosts = await this.getHostsInconfig();
      await this.checkMissingApisInRegistry(angular.copy(hosts));
      hosts.map(h => {
        this.setApiEntryInfo(h, h);
      });
      this.props.digest();
    } catch (error) {
      this.props.handleError('Cannot get cluster information about API entries');
    }
  }

  /**
   * Set in the apiEntries the cluster information for each API
   * @param {String} id 
   * @param {Object} info 
   */
  setApiEntryInfo(id, info) {
    const idx = this.props.getSelectedApiIndex(id);
    delete info.id;
    this.props.apiEntries[idx].cluster_info = info;
  }

  /**
   * Checks if in the wazuh-registry.json is missing any API entry of the config.yml in order to create it.
   * @param {Object} registryHosts
   */
  async checkMissingApisInRegistry(registryHosts) {
    try {
      const registryIds = registryHosts.map(h => {return h.id.toString()});
      const entriesIds = this.props.apiEntries.map(e => {return e._id});
      const diff = entriesIds.filter(api => !registryIds.includes(api));
      if (!diff.length) return;
      diff.map(async id => {
        const api = await this.props.setHostRegistryInfo(id);
        const info = api.data || {};
        this.setApiEntryInfo(id, info);
      });
    } catch (error) {
      this.props.handleError('Cannot update registry');
    }
  }

  shouldComponentUpdate() {
    this.bindClusterInfo();
    return true;
  }

  onChangeEdit(e, field) {
    this.setState({
      [field]: e.target.value
    });
  }

  toggleDetails(item) {
    this.editionEnabled = true;
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
    } else {
      itemIdToExpandedRowMap[item._id] = (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Username">
              <EuiFieldText
                onChange={e => this.onChangeEdit(e, 'user')}
                placeholder="foo"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Password">
              <EuiFieldPassword
                onChange={e => this.onChangeEdit(e, 'password')}
                placeholder="bar"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Host">
              <EuiFieldText
                onChange={e => this.onChangeEdit(e, 'url')}
                placeholder="http://localhost"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Port">
              <EuiFieldNumber
                max={99999}
                onChange={e => this.onChangeEdit(e, 'port')}
                placeholder={55000}
              />
            </EuiFormRow>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFormRow label="Actions">
              <EuiButton
                aria-label="Update"
                iconType="save"
                color="primary"
                onClick={() =>
                  this.props
                    .updateSettings({ ...this.state, _id: item._id }, true)
                    .then(result => {
                      result !== -1 && this.toggleDetails(item)
                      this.editionEnabled = false;
                    })
                }
              >
                Save
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    this.setState({ itemIdToExpandedRowMap });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      apiEntries: nextProps.apiEntries,
      currentDefault: nextProps.currentDefault
    });
  }

  render() {
    const { itemIdToExpandedRowMap } = this.state;
    const items = [...this.props.apiEntries];
    const columns = [
      {
        field: 'cluster_info.cluster',
        name: 'Cluster',
        align: 'left'
      },
      {
        field: 'cluster_info.manager',
        name: 'Manager',
        align: 'left'
      },
      {
        field: 'url',
        name: 'Host',
        align: 'left'
      },
      {
        field: 'api_port',
        name: 'Port',
        align: 'left'
      },
      {
        field: 'api_user',
        name: 'User',
        align: 'left'
      },
      {
        name: 'Actions',
        render: item => (
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Set as default</p>}>
                <EuiButtonIcon
                  iconType={
                    item._id == this.props.currentDefault
                      ? 'starFilled'
                      : 'starEmpty'
                  }
                  aria-label="Set as default"
                  onClick={async () => {
                    const currentDefault = await this.props.setDefault(item);
                    this.setState({
                      currentDefault
                    });
                  }}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Check connection</p>}>
                <EuiButtonIcon
                  aria-label="Check connection"
                  iconType="refresh"
                  onClick={() => this.props.checkManager(item)}
                  color="success"
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Remove</p>}>
                <EuiButtonIcon
                  aria-label="Remove manager"
                  iconType="trash"
                  onClick={() =>
                    this.props.removeManager(item).then(apiEntries =>
                      this.setState({
                        apiEntries
                      })
                    )
                  }
                  color="danger"
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      },

      {
        align: RIGHT_ALIGNMENT,
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiToolTip position="bottom" content={<p>Edit</p>}>
            <EuiButtonIcon
              onClick={() => this.toggleDetails(item)}
              aria-label={
                itemIdToExpandedRowMap[item.id]
                  ? 'Collapse edition'
                  : 'Expand edition'
              }
              iconType={
                itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'
              }
            />
          </EuiToolTip>
        )
      }
    ];
    return (
      <EuiPanel>
        <EuiBasicTable
          itemId="_id"
          items={items}
          columns={columns}
          itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
          isExpandable={true}
        />
        <EuiSpacer size="m" />
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              aria-label="Add"
              iconType="plusInCircle"
              onClick={() => this.props.switch()}
            >
              Add new
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

ApiTable.propTypes = {
  apiEntries: PropTypes.array,
  currentDefault: PropTypes.string,
  updateSettings: PropTypes.func,
  setDefault: PropTypes.func,
  checkManager: PropTypes.func,
  getApisInRegistry: PropTypes.func,
  getSelectedApiIndex: PropTypes.func,
  digest: PropTypes.func,
  removeManager: PropTypes.func,
  switch: PropTypes.func,
  handleError: PropTypes.func,
  setHostRegistryInfo: PropTypes.func,
};
