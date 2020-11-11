
const windowsColumns = [{id: 'name', width: '10%'}, {id: 'pid'}, {id: 'ppid'}, {id: 'vm_size'}, {id: 'priority'}, {id: 'nlwp'}, {id: 'cmd', width: '30%'}];
const linuxColumns = [{id: 'name', width: '10%'}, {id: 'euser'}, {id: 'egroup'} ,{id: 'pid'}, {id: 'ppid'}, {id: 'cmd', width: '15%'}, {id:'argvs', width: "15%"}, 
{id: 'vm_size'}, {id: 'size'}, {id: 'session'}, {id: 'nice'}, {id: 'state', width: "15%"}];
const macColumns = [{id: 'name', width: '10%'}, {id: 'euser'},{id: 'pid'}, {id: 'ppid'}, {id: 'vm_size'}, {id: 'nice'}, 
{id: 'state', width: "15%"}];

export const processColumns = {
  'windows': windowsColumns,
  'linux': linuxColumns,
  'apple': macColumns
}

const windowsPortsColumns = [{id: "process"},{id: "local.ip", sortable: false}, {id: "local.port", sortable: false}, 
{id: "state"}, {id: "protocol"}];
const linuxPortsColumns = [{id: "local.ip", sortable: false}, {id: "local.port", sortable:false}, {id: "state"}, {id: "protocol"}];

export const portsColumns = {
  'windows': windowsPortsColumns,
  'linux': linuxPortsColumns,
  'apple': linuxPortsColumns
}

const windowsPackagesColumns = [{id:'name'},{id:'architecture', width: "10%"},{id:'version'},{id:'vendor', width: '30%'}] ;
const linuxPackagesColumns = [{id:'name'},{id:'architecture',width:'10%'},{id:'version'},{id:'vendor', width: "30%"},{id:'description', width: '30%'}];
const MacPackagesColumns = [{id:'name'},{id:'version'},{id:'format'},{id:'location', width: "30%"},{id:'description', width: '20%'}]
export const packagesColumns = {
  'windows': windowsPackagesColumns,
  'linux': linuxPackagesColumns,
  'apple': MacPackagesColumns
}