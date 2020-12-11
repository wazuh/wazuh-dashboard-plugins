import React, { Component, Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiTitle,
  EuiHealth,
  EuiHorizontalRule,
  EuiPage,
  EuiSwitch,
  EuiButton,
  EuiPopover,
  WzTextWithTooltipIfTruncated,
  EuiSelect,
  EuiLoadingChart,
  EuiBasicTable,
  WzButtonPermissions,
  EuiToolTip,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiPageBody
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { toggleAddSuricata, savePluginToEdit, deleteService, syncRuleset, GetMainconfData, IsLoadingData, changeServiceStatus, NidsShowFile, ChangeMainServiceStatus  } from '../../../../redux/actions/nidsActions';
import { log } from '../../../../../server/logger';
import { AppNavigate } from '../../../../react-services/app-navigate';
import { AddSuricata } from './add-suricata';

export const SuricataTable = withReduxProvider(() => {
  const dispatch = useDispatch();
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
  const nodePlugins = useSelector(state => state.nidsReducers.nodePlugins);
  const loadingData = useSelector(state => state.nidsReducers.loadingData);
  const toggleSuricata = useSelector(state => state.nidsReducers.toggleSuricata);
  const mainServiceStatus = useSelector(state => state.nidsReducers.mainServiceStatus);
  const mainConfData = useSelector(state => state.nidsReducers.mainConfData);

  const [plugins, setPlugins] = useState([])

  useEffect(() => {
    dispatch(IsLoadingData(true));
    getPlugin()
  }, [nodePlugins]);
  
  useEffect(() => {
    dispatch(GetMainconfData(nodeDetail.uuid));
    getPlugin()
  }, [mainServiceStatus]);

  const title = headRender();

  function getPlugin() {
    var allSuricata = [];
    [...Object.keys(nodePlugins).map((item) => {
      if (nodePlugins[item]["type"] == "suricata") {
        nodePlugins[item]["service"] = item
        allSuricata.push(nodePlugins[item])
      }
    })];

    var plug = []
    const formatedNodes = (allSuricata || []).map(plugin => {
      plug.push(formatNode(plugin))
    });

    setPlugins(plug)
    dispatch(IsLoadingData(false));
  }

  function formatNode(plugin) {
    return {
      ...plugin,
      actions: plugin
    };
  }

  const onChangeSwitch = (e) => {
    var newStatus;
    {mainConfData["suricata"]["status"] == "enabled" ? newStatus="disabled" : newStatus="enabled"}

    var data = {
      uuid: nodeDetail.uuid,
      param: 'status',
      service: 'suricata',
      status: newStatus
    }
    dispatch(IsLoadingData(true));
    dispatch(ChangeMainServiceStatus(data));
  };

  function headRender() {
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
                    <h2>Suricata list </h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiSwitch
                    label={mainConfData["suricata"]["status"] == "enabled" ? "Suricata is enabled!" : "Suricata is disabled!"}
                    checked={mainConfData["suricata"]["status"] == "enabled" ? true : false}
                    onChange={(e) => onChangeSwitch(e)}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="m" />
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              // permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
              iconType="plusInCircle"
              onClick={() => { dispatch(toggleAddSuricata(true)) }}
            >
              Add Suricata
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
        field: 'name',
        name: 'Description',
        sortable: true,
        // width: '20%',
        // truncateText: true
      },
      {
        field: 'status',
        name: 'Status',
        // width: '15%',
        // truncateText: true,
        sortable: true,
        render: item => {
          if (item == "disabled") {
            return <EuiHealth color="danger">OFF</EuiHealth>
          } else {
            return <EuiHealth color="success">ON</EuiHealth>
          }
        }
      },
      {
        field: 'running',
        name: 'Running',
        // width: '15%',
        // truncateText: true,
        sortable: true, 
        render: item => {
          if (item == "false") {
            return <EuiHealth color="danger">Stopped</EuiHealth>
          } else {
            return <EuiHealth color="success">Running</EuiHealth>
          }
        }
      },
      {
        field: 'bpf',
        name: 'BPF',
        // width: '10%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'localRulesetName',
        name: 'Ruleset',
        // width: '10%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'interface',
        name: 'Interface',
        // width: '15%',
        // truncateText: true,
        sortable: true
      },
      {
        field: 'actions',
        name: 'Actions',
        width: '15%',
        render: data => actionButtonsRender(data)
      }
    ];
  }

  function actionButtonsRender(data) {
    return (
      <div className={'icon-box-action'}>
        {
          data.status == "enabled"
            ?
            <EuiToolTip content="Stop Suricata" position="left">
              <EuiButtonIcon
                onClick={ev => {
                  dispatch(IsLoadingData(true));
                  dispatch(changeServiceStatus({
                    uuid: nodeDetail.uuid,
                    status: "disabled",
                    param: "status",
                    service: data.service,
                    type: data.type,
                    interface: data.interface
                  }))
                }}
                iconType="stop"
                color={'primary'}
                aria-label="Stop Suricata"
              />
            </EuiToolTip>
            :
            <EuiToolTip content="Launch Suricata" position="left">
              <EuiButtonIcon
                onClick={ev => {
                  dispatch(IsLoadingData(true));
                  dispatch(changeServiceStatus({
                    uuid: nodeDetail.uuid,
                    status: "enabled",
                    param: "status",
                    service: data.service,
                    type: data.type,
                    interface: data.interface
                  }))
                }}
                iconType="play"
                color={'primary'}
                aria-label="Launch Suricata"
              />
            </EuiToolTip>

        }

        <EuiToolTip content="Sync ruleset" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(syncRuleset({ uuid: nodeDetail.uuid, service: data.service, ruleset: data.ruleset, type: "node" }))
            }}
            iconType="refresh"
            color={'primary'}
            aria-label="Sync ruleset"
          />
        </EuiToolTip>

        <EuiToolTip content="Edit Suricata" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(toggleAddSuricata(true))
              dispatch(savePluginToEdit(data))
            }}
            iconType="pencil"
            color={'primary'}
            aria-label="Edit Suricata"
          />
        </EuiToolTip>

        <EuiToolTip content="Edit Suricata file" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(NidsShowFile("suricata_config"))
              AppNavigate.navigateToModule(ev, 'nids-files', {})
            }}
            iconType="documentEdit"
            color={'primary'}
            aria-label="Edit Suricata file"
          />
        </EuiToolTip>

        <EuiToolTip content="Delete Suricata" position="left">
          <EuiButtonIcon
            onClick={ev => {
              dispatch(deleteService({ uuid: nodeDetail.uuid, service: data.service }))
            }}
            iconType="trash"
            color={'danger'}
            aria-label="Label Delete Suricata"
          />
        </EuiToolTip>
      </div>
    );
  }

  return (
    <div>
      <br />
      {toggleSuricata ? <AddSuricata></AddSuricata> : null}
      <br />
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="m">
        {title}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiBasicTable
              items={plugins}
              itemId="uuid"
              columns={columns()}
              loading={loadingData}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  )
});