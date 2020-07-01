import React, { Fragment } from 'react';
import { EuiEmptyPrompt, EuiButton, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiCallOut } from '@elastic/eui';
import {InventoryMetrics} from './components/syscollector-metrics';
import {SyscollectorTable} from './components/syscollector-table';

export function SyscollectorInventory({agent}){

  if (agent && agent.status === 'Never connected'){
    return (<EuiEmptyPrompt
      iconType="securitySignalDetected"
      style={{ marginTop: 20 }}
      title={<h2>Agent has never connected.</h2>}
      body={
        <Fragment>
          <p>
            The agent has been registered but has not yet connected to the manager.
        </p>
          <a href="https://documentation.wazuh.com/current/user-manual/agents/agent-connection.html" target="_blank">
            https://documentation.wazuh.com/current/user-manual/agents/agent-connection.html
        </a>
        </Fragment>
      }
      actions={
        <EuiButton href='#/agents-preview?' color="primary" fill>
          Back
      </EuiButton>
      }
    /> );
  }               

  const portsColumns = agent && agent.os && agent.os.platform === 'windows' ? [{id: "process"},{id: "local.ip", sortable: false}, {id: "local.port", sortable: false}, {id: "state"}, {id: "protocol"}]
    : [{id: "local.ip", sortable: false}, {id: "local.port", sortable:false}, {id: "state"}, {id: "protocol"}]
  const netifaceColumns =  [{id: "name"}, {id: "mac"}, {id: "state", value:"State"}, {id:"mtu", value:"MTU"}, {id: "type", value:"Type"}];
  const processesColumns = agent && agent.os && agent.os.platform === 'windows' ? [{id: 'name', width: '10%'}, {id: 'pid'}, {id: 'ppid'}, {id: 'vm_size'}, {id: 'priority'}, {id: 'nlwp'}, {id: 'cmd', width: '30%'}]
    : [{id: 'name', width: '10%'}, {id: 'euser'}, {id: 'egroup'} ,{id: 'pid'}, {id: 'ppid'}, {id: 'cmd', width: '15%'}, {id:'argvs', width: "15%"}, {id: 'vm_size'}, {id: 'size'}, {id: 'session'}, {id: 'nice'}, {id: 'state', width: "15%"}]
  const netaddrColumns = [{id:'iface'},{id:'address'},{id:'netmask'},{id:'proto'},{id:'broadcast'}];
  const packagesColumns = agent && agent.os && agent.os.platform === 'windows' ? [{id:'name'},{id:'architecture', width: "10%"},{id:'version'},{id:'vendor', width: '30%'}] 
    : agent && agent.os && agent.os.platform === 'darwin' ?  [{id:'name'},{id:'version'},{id:'format'},{id:'location', width: "30%"},{id:'description', width: '20%'}]
      :  [{id:'name'},{id:'architecture',width:'10%'},{id:'version'},{id:'vendor', width: "30%"},{id:'description', width: '30%'}]


  return (
    <div style={{overflow: 'hidden'}}>
      {agent && agent.status === 'Disconnected' && 
         <EuiCallOut
         style={{margin: "8px 16px 8px 16px"}}
         title="This agent is currently disconnected, the data may be outdated."
         iconType="iInCircle"
       />
      }
      <EuiFlexGroup gutterSize="s"> 
        <EuiFlexItem style={{marginBottom: 0}}>
          <InventoryMetrics agent={agent}></InventoryMetrics> 
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={2} style={{marginRight: 4, marginTop: 0}}>
          <SyscollectorTable tableParams={ {path: `/syscollector/${agent.id}/netiface`, title: "Network interfaces", columns: netifaceColumns ,icon: "indexMapping",  searchBar: false, exportFormatted: false }} />
        </EuiFlexItem>
        <EuiFlexItem grow={2} style={{marginLeft: 4, marginTop: 0}}>
          <SyscollectorTable tableParams={ {path: `/syscollector/${agent.id}/ports`, title: "Network ports", columns: portsColumns, icon: "inputOutput",  searchBar: false, exportFormatted: false }} />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={3} style={{marginRight: 4}} >
          <SyscollectorTable tableParams={ {path: `/syscollector/${agent.id}/netaddr`, title: "Network settings", columns: netaddrColumns, icon: "controlsHorizontal",  searchBar: false, exportFormatted: false }} />
        </EuiFlexItem>
        {agent && agent.os && agent.os.platform === 'windows' && 
          <EuiFlexItem grow={1} style={{marginLeft: 4}}>
            <SyscollectorTable tableParams={ {path: `/syscollector/${agent.id}/hotfixes`, title: "Windows updates", columns: [{id:'hotfix'}], icon: "logoWindows",  searchBar: false, exportFormatted: false }} />
          </EuiFlexItem>
        }
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem >
          <SyscollectorTable tableParams={ {path: `/syscollector/${agent.id}/packages`, title: "Packages", columns: packagesColumns, icon: "apps",  searchBar: true, exportFormatted: 'packages.csv' }} />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem >
          <SyscollectorTable tableParams={ {path: `/syscollector/${agent.id}/processes`, title: "Processes", columns: processesColumns, icon: "console",  searchBar: true, exportFormatted: 'processes.csv' }} />
        </EuiFlexItem>
      </EuiFlexGroup>

    </div>
  );
}