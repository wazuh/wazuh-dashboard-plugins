import React, { Component, Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiDescriptionList,
  EuiSpacer,
  EuiText,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiTitle,
  EuiHealth,
  EuiHorizontalRule,
  EuiPage,
  EuiButton,
  EuiPopover,
  WzTextWithTooltipIfTruncated,
  EuiSelect,
  EuiTextColor,
  EuiBadge,
  EuiLoadingChart,
  EuiBasicTable,
  WzButtonPermissions,
  EuiToolTip,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiPageBody
} from '@elastic/eui';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { IsLoadingData, toggleNetworkSocket, savePluginToEdit, stopStapService, deployStapService, deleteService } from '../../../../redux/actions/nidsActions';

export const NetworkToSocket = () => {
  const dispatch = useDispatch();
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
  const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);
  const loadingData = useSelector(state => state.nidsReducers.loadingData);

  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({});
  const [plugins, setPlugins] = useState([])

  useEffect(() => {
    dispatch(IsLoadingData(true));
    formatPlugin()
  }, []);

  useEffect(() => {
    dispatch(IsLoadingData(true));
    formatPlugin()
  }, [nodePlugins]);

  function formatPlugin() {
    var allSTAP = [];

    [...Object.keys(nodePlugins).map((item) => {
      if (nodePlugins[item]["type"] == "network-socket") {
        nodePlugins[item]["service"] = item
        nodePlugins[item]["connectionName"] = nodePlugins[item]["name"] + ' -/- ' + nodePlugins[item]["connectionsCount"]
        allSTAP.push(nodePlugins[item])
      }
    })];

    var plug = []
    const formatedNodes = (allSTAP || []).map(plugin => {
      plug.push({ ...plugin, actions: plugin })
    });

    setPlugins(plug)
    dispatch(IsLoadingData(false));
  }

  const title = headRender();

  function headRender() {
    return (
      <div>
        <EuiFlexGroup>

          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                  <h2>Network->Socket </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="plusInCircle"
              onClick={() => { dispatch(toggleNetworkSocket("add")) }}
            >
              Add Network->Socket
              </EuiButtonEmpty>
          </EuiFlexItem>

        </EuiFlexGroup>
        <EuiSpacer size="xs" />
      </div>
    );
  }


  function columns() {
    return [
      {
        field: 'connectionName',
        name: 'Description',
        sortable: true,
        render: item => {
          var dataArray = item.split(' -/- ');
          return (
            <>
              <EuiTextColor color="default">{dataArray[0]}  </EuiTextColor>
              <EuiBadge color='default'>{dataArray[1]}</EuiBadge>
            </>
          );
        },
      },
      {
        field: 'pid',
        name: 'Status',
        sortable: true,
        render: item => {
          if (item == "none") {
            return <EuiHealth color="danger">Stopped</EuiHealth>
          } else {
            return <EuiHealth color="success">Running</EuiHealth>
          }
        }
      },
      {
        field: 'running',
        name: 'Running',
        sortable: true,
        render: item => {
          if (item == "true") {
            return <EuiHealth color="success">ON</EuiHealth>
          } else {
            return <EuiHealth color="danger">OFF</EuiHealth>
          }
        }
      },
      {
        field: 'port',
        name: 'Port',
        sortable: true
      },
      {
        field: 'cert',
        name: 'Certificate',
        sortable: true
      },
      {
        field: 'interface',
        name: 'Interface',
        sortable: true
      },
      {
        field: 'collector',
        name: 'Collector',
        sortable: true
      },
      {
        field: 'bpf',
        name: 'BPF',
        sortable: true
      },
      {
        field: 'actions',
        name: 'Actions',
        width: '15%',
        render: data => actionButtonsRender(data)
      },
      {
        align: RIGHT_ALIGNMENT,
        width: '40px',
        isExpander: true,
        render: (item) => (
          <EuiButtonIcon
            onClick={() => toggleDetails(item)}
            aria-label={itemIdToExpandedRowMap[item.service] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item.service] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      },
    ];
  }

  function ConnColumns() {
    return [
      {
        field: 'proto',
        name: 'Proto',
      },
      {
        field: 'recvQ',
        name: 'Recv-Q',
      },
      {
        field: 'sendQ',
        name: 'Send-Q',
      },
      {
        field: 'localAddr',
        name: 'Local Addr',
      },
      {
        field: 'clientAddr',
        name: 'Client Addr',
      },
      {
        field: 'state',
        name: 'State',
      },
      {
        field: 'pid',
        name: 'PID/name',
      },

    ];
  }

  const toggleDetails = (item) => {
    // item.connections = "tcp        0      1 192.168.1.101:59660     192.168.1.100:50010     SYN_SENT    5126/socat          \ntcp        0      1 192.168.1.101:59664     192.168.1.100:50010     SYN_SENT    5128/socat          \ntcp        0      1 192.168.1.101:59662     192.168.1.100:50010     SYN_SENT    5127/socat          \n"
    // item.connectionsCount = "3"
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[item.service]) {
      delete itemIdToExpandedRowMapValues[item.service];
    } else {
      var connectionContent;
      var connItems = [];

      //split and filter connection data
      var conns = item.connections.split("\n");
      var result = conns.filter(con => con != "");
      result.forEach(function (item, index) {
        var splittedData = item.split(' ');
        var dataFiltered = splittedData.filter(word => word != '');
        connItems.push({
          proto: dataFiltered[0],
          recvQ: dataFiltered[1],
          sendQ: dataFiltered[2],
          localAddr: dataFiltered[3],
          clientAddr: dataFiltered[4],
          state: dataFiltered[5],
          pid: dataFiltered[6],
        })
      });

      //check for connections number
      {
        item.connections == "" || item.connectionsCount == "0"
          ?
          connectionContent = 'No connections available'
          :
          connectionContent = <EuiBasicTable
            items={connItems}
            itemId="service"
            columns={ConnColumns()}
            loading={false}
          />
      }

      const listItems = [
        {
          title: 'Connections',
          description: connectionContent
        },
      ];
      itemIdToExpandedRowMapValues[item.service] = (
        <EuiDescriptionList listItems={listItems} />
      );
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  function actionButtonsRender(data) {
    return (
      <div className={'icon-box-action'}>
        {
          data["running"] == "true"
            ?
            <EuiToolTip content="Stop" position="left">
              <EuiButtonIcon
                onClick={ev => {
                  dispatch(IsLoadingData(true));
                  dispatch(stopStapService(
                    {
                      uuid: nodeDetail.uuid,
                      service: data.service,
                      type: data.type,
                    }
                  ))
                }}
                iconType="stop"
                color={'primary'}
                aria-label="Stop"
              />
            </EuiToolTip>
            :
            <EuiToolTip content="Play" position="left">
              <EuiButtonIcon
                onClick={ev => {
                  dispatch(IsLoadingData(true));
                  dispatch(deployStapService(
                    {
                      uuid: nodeDetail.uuid,
                      service: data.service,
                      type: data.type,
                    }
                  ))
                }}
                iconType="play"
                color={'primary'}
                aria-label="Play"
              />
            </EuiToolTip>
        }

        <EuiToolTip content="Edit" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(savePluginToEdit(data))
              dispatch(toggleNetworkSocket("edit"))
            }}
            iconType="documentEdit"
            color={'primary'}
            aria-label="Edit"
          />
        </EuiToolTip>

        <EuiToolTip content="Delete" position="left">
          <EuiButtonIcon
            onClick={ev => { dispatch(IsLoadingData(true)); dispatch(deleteService({ uuid: nodeDetail.uuid, service: data.service })) }}
            iconType="trash"
            color={'primary'}
            aria-label="Delete"
          />
        </EuiToolTip>

      </div>
    );
  }

  return (
    <div>
      <br />
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="m">
        {title}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiBasicTable
              items={plugins}
              itemId="service"
              columns={columns()}
              loading={loadingData}
              itemIdToExpandedRowMap={itemIdToExpandedRowMap}
              isExpandable={true}
              hasActions={true}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  )
}
