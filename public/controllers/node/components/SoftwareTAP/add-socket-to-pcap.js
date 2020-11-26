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
	EuiButton,
	EuiPopover,
	WzTextWithTooltipIfTruncated,
	EuiSelect,
	EuiFormRow,
	EuiLoadingChart,
	EuiBasicTable,
	EuiFieldText,
	EuiToolTip,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiPageBody
} from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../../components/common/hocs';
import { toggleSocketPcap, updateService, addStap, IsLoadingData, savePluginToEdit } from '../../../../redux/actions/nidsActions';

export const AddSocketToPcap = () => {

  const dispatch = useDispatch();
	const showSocPcap = useSelector(state => state.nidsReducers.showSocPcap);
	const interfaces = useSelector(state => state.nidsReducers.interfaces);
	const editPlugin = useSelector(state => state.nidsReducers.editPlugin);
	const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);

	const [formatInterfaces, setFormatInterfaces] = useState([])
	const [stapData, setStapData] = useState({
		uuid: "",
		service: "",
		type: "",
		name: "",
		port: "",
		cert: "",
		bpf: "",
		"pcap-path": "",
		"pcap-prefix": "",
	})

	useEffect(() => {
    console.log("BEFORE");
    console.log(editPlugin);
  },[])
	useEffect(() => {
    console.log("AFTER");
    console.log(stapData);
  },[stapData])

	useEffect(() => {
		//create interface array
		var ifaces = []
		Object.entries(interfaces || {}).map((id) => {
			ifaces.push({ value: id[0], text: id[0] })
		})
		setFormatInterfaces(ifaces);

		if (Object.entries(editPlugin).length !== 0) {
			setStapData({
				uuid: nodeDetail.uuid,
				service: editPlugin.service,
        type: "socket-pcap",
				name: editPlugin.name,
				cert: editPlugin.cert,
				port: editPlugin.port,
        bpf: editPlugin.bpf,
        "pcap-path": editPlugin["pcap-path"],
        "pcap-prefix": editPlugin["pcap-prefix"],
			})
		}

	}, []);

	const handleChangeEdit = (event) => {
		setStapData({
			...stapData,
			[event.target.name]: event.target.value
		})
	}

	const handleAddRequest = () => {
    var data = {
      uuid: nodeDetail.uuid,
      type: "socket-pcap",
      name: stapData.name,
      cert: stapData.cert,
      port: stapData.port,
      bpf: stapData.bpf,
      "pcap-path": stapData["pcap-path"],
      "pcap-prefix": stapData["pcap-prefix"],
    }
    
    dispatch(IsLoadingData(true));
		dispatch(toggleSocketPcap(''));
		dispatch(addStap(data));
	}

	const handleEditRequest = () => {
		dispatch(IsLoadingData(true));
		dispatch(toggleSocketPcap(''));
		dispatch(updateService(
			{
				uuid: nodeDetail.uuid,
				service: stapData.service,
				type: "socket-pcap",
				name: stapData.name,
				port: stapData.port,
				cert: stapData.cert,
        interface: stapData.interface,
        bpf: stapData.bpf,
        "pcap-path": stapData["pcap-path"],
        "pcap-prefix": stapData["pcap-prefix"],
			}
		));
	}

  return (
    <div>
    <EuiPanel paddingSize="m">

      {/* Header */}
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size={'s'} style={{ padding: '6px 0px' }}>
            {
              showSocPcap == 'edit' ?
              <h2>Edit Socket->PCAP</h2> :
              <h2>Add Socket->PCAP</h2>
            }
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            iconType="cross"
            onClick={() => {
              dispatch(savePluginToEdit({}))
              dispatch(toggleSocketPcap(''))
            }}
          >
            Close
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xs" />

      {/* row */}
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Description">
            <EuiFieldText value={stapData.name} name="name" aria-label="Description" onChange={handleChangeEdit} />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="Port">
            <EuiFieldText value={stapData.port} name="port" aria-label="Port" onChange={handleChangeEdit} />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* row */}
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="PCAP-Path">
            <EuiFieldText value={(stapData["pcap-path"] || '')} name="pcap-path" aria-label="PCAP-Path" onChange={handleChangeEdit} />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="PCAP-prefix">
            <EuiFieldText value={(stapData["pcap-prefix"] || '')} name="pcap-prefix" aria-label="PCAP-prefix" onChange={handleChangeEdit} />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* row */}
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Certificate">
            <EuiFieldText value={stapData.cert} name="cert" aria-label="Certificate" onChange={handleChangeEdit} />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="BPF">
            <EuiFieldText value={stapData.bpf} name="bpf" aria-label="BPF" onChange={handleChangeEdit} />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

     

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow>
            {
              showSocPcap == 'edit' ?
              <EuiButton onClick={() => { handleEditRequest() }}>Edit</EuiButton> :
              <EuiButton onClick={() => { handleAddRequest() }}>Add</EuiButton>
            }
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

    </EuiPanel>

  </div>
  )
}
