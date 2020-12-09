import { NidsRequest } from '../../react-services/nids-request';

export function getAllNodes() {
  return async (dispatch) => {
    const nodes = await NidsRequest.genericReq('GET', '/nids/nodes', {});
    dispatch(accGetAllNodes(nodes.data.data))
  }
}
function accGetAllNodes(nodes) {
  console.log("accGetAllNodes");
  console.log(nodes);
  return {
    type: 'NODES',
    payload: nodes
  }
};

export function getFile(file) {
  return async (dispatch) => {
    var params = {
      method: "GET",
      path: '/node/loadfile/' + file.uuid + '/' + file.file
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/getFileContent', { params });
    console.log(values.data.data);
    dispatch(accGetFile(values.data.data))
  }
}
function accGetFile(data) {
  return {
    type: 'FILE_CONTENT',
    payload: data
  }
};

export function deployStapService(stap) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/deployStapService',
      data: stap
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/deployStapService', { params });
    dispatch(PingPluginsNode(stap.uuid))
  }
}

export function stopStapService(stap) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/stopStapService',
      data: stap
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/stopStapService', { params });
    dispatch(PingPluginsNode(stap.uuid))
  }
}

export function SaveCurrentContent(fileData) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/wazuh/saveFileContentWazuh',
      data: fileData
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/SaveCurrentContent', params);
  }
}

export function NidsSaveFile(fileData) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/savefile',
      data: fileData
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/saveNidsFile', { params });
  }
}

// export function ReloadFilesData(uuid) {
//   return async (dispatch) => {
//     var params = {
//       method: "GET",
//       path: `/node/reloadFilesData/${uuid}`
//     }
//     const zeek = await NidsRequest.genericReq('PUT', '/nids/zeek', params);
//     dispatch(IsLoadingData(false))
//     dispatch(IsLoadingData(false))

//   }
// }

export function PingZeek(uuid) {
  return async (dispatch) => {
    var params = {
      method: "GET",
      path: `/node/zeek/${uuid}`
    }
    const zeek = await NidsRequest.genericReq('PUT', '/nids/zeek', params);
    dispatch(IsLoadingData(false))
    dispatch(accPingZeek(zeek.data.data))
  }
}
function accPingZeek(zeek) {
  return {
    type: 'ZEEK',
    payload: zeek
  }
};

export function getAllTags() {
  return async (dispatch) => {
    const tags = await NidsRequest.genericReq('GET', '/nids/tags', {});
    dispatch(accGetAllTags(tags.data.data))
  }
}
function accGetAllTags(tags) {
  return {
    type: 'TAGS',
    payload: tags
  }
};

export function getAllOrgs() {
  return async (dispatch) => {
    const orgs = await NidsRequest.genericReq('GET', '/nids/orgs', {});
    dispatch(accGetAllOrgs(orgs.data.data))
  }
}
function accGetAllOrgs(orgs) {
  return {
    type: 'ORGS',
    payload: orgs
  }
};

export function getAllGroups() {
  return async (dispatch) => {
    const groups = await NidsRequest.genericReq('GET', '/nids/groups', {});
    dispatch(accGetAllGroups(groups.data.data))
  }
}
function accGetAllGroups(groups) {
  return {
    type: 'GROUPS',
    payload: groups
  }
};

export function LoadInterfaces() {
  return async (dispatch) => {
    const ifaces = await NidsRequest.genericReq('GET', '/nids/interfaces', {});
    dispatch(accSaveInterfaces(ifaces.data.data))
  }
}
function accSaveInterfaces(ifaces) {
  return {
    type: 'INTERFACES',
    payload: ifaces
  }
};

export function ChangeAnalyzerStatus(values) {
  return async (dispatch) => {
    var params = {
      method: "PUT",      
      path: '/node/analyzer',
      data: values
    }   
    const data = await NidsRequest.genericReq('PUT', '/nids/ChangeAnalyzerStatus', params);
    dispatch(IsLoadingData(false)); 
    dispatch(PingAnalyzer(values.uuid)); 
  }
}

export function ReloadFilesData(uuid) {
  return async (dispatch) => {
    var params = {
      method: "GET",      
      path: `/node/reloadFilesData/${uuid}`
    }   
    const data = await NidsRequest.genericReq('PUT', '/nids/ReloadFilesData', params);
    dispatch(IsLoadingData(false)); 
    dispatch(PingAnalyzer(uuid)); 
  }
}

export function PingAnalyzer(uuid) {
  return async (dispatch) => {
    var params = {
      method: "GET",      
      path: `/node/PingAnalyzer/${uuid}`
    }
   
    const data = await NidsRequest.genericReq('PUT', '/nids/pingAnalyzer', params);
    console.log("data.data.data");
    console.log(data.data.data);
    dispatch(accAnalyzer(data.data.data))
  }
}
function accAnalyzer(data) {
  return {
    type: 'ANALYZER',
    payload: data
  }
};

export function loadRuleset() {
  return async (dispatch) => {
    const rsets = await NidsRequest.genericReq('GET', '/nids/rulesets', {});
    dispatch(accSaveRulesets(rsets.data.data))
  }
}
function accSaveRulesets(rsets) {
  return {
    type: 'RULESETS',
    payload: rsets
  }
};

export function deleteNode(uuid) {
  var params = {
    method: "DELETE",
    path: `/node/${uuid}`
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('PUT', '/nids/node/delete', params);
    dispatch(getAllNodes())
  }
}

export function addNode(nodeData) {
  var params = {
    method: "POST",
    path: '/node/enrollNewNode',
    data: nodeData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('POST', '/nids/node/enroll', params)
    dispatch(getAllNodes())
  }
}

export function LaunchZeekMainConf(values) {
  var params = {
    method: "PUT",
    path: '/node/LaunchZeekMainConf',
    data: values
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('PUT', '/nids/node/LaunchZeekMainConf', params)
    dispatch(PingZeek(values.uuid))
  }
}

export function editNode(nodeData) {
  var params = {
    method: "PUT",
    path: '/node/updateNodeReact',
    data: nodeData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('PUT', '/nids/node/editNode', params)
    dispatch(getAllNodes())
  }
}

export function updateService(pluginData) {
  console.log("updating stap...");
  var params = {
    method: "PUT",
    path: '/node/modifyNodeOptionValues',
    data: pluginData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('PUT', '/nids/node/updateService', params)
    dispatch(PingPluginsNode(pluginData.uuid))
  }
}

export function changeServiceStatus(pluginData) {
  var params = {
    method: "PUT",
    path: '/node/changeServiceStatus',
    data: pluginData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('PUT', '/nids/node/changeServiceStatus', params)
    dispatch(PingPluginsNode(pluginData.uuid))
  }
}

export function syncRuleset(pluginData) {
  var params = {
    method: "PUT",
    path: '/node/ruleset/set',
    data: pluginData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('PUT', '/nids/node/syncRuleset', params)
    dispatch(PingPluginsNode(pluginData.uuid))
  }
}

export function addService(pluginData) {
  var params = {
    method: "POST",
    path: '/node/addService',
    data: pluginData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('POST', '/nids/node/addService', params)
    dispatch(PingPluginsNode(pluginData.uuid))
  }
}

export function addStap(pluginData) {
  console.log("Adding stap...");
  var params = {
    method: "POST",
    path: '/node/add',
    data: pluginData
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('POST', '/nids/node/addStap', params)
    dispatch(PingPluginsNode(pluginData.uuid))
  }
}


export function deleteService(values) {
  var params = {
    method: "DELETE",
    path: `/node/deleteService`,
    data: values
  }
  return async (dispatch) => {
    const data = await NidsRequest.genericReq('DELETE', '/nids/node/deleteService', params);
    dispatch(PingPluginsNode(values.uuid))
  }
}

export function PingPluginsNode(uuid) {
  return async (dispatch) => {
    var params = {
      method: "GET",
      path: '/node/PingPluginsNode/' + uuid,
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/node/PingPluginsNode', params)
    dispatch(savePlugins(values.data.data))
  }
}

export function PingWazuh(uuid) {
  return async (dispatch) => {
    var params = {
      method: "GET",
      path: '/node/wazuh/' + uuid,
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/PingWazuh', params)
    dispatch(accPingWwazuh(values.data.data))
  }
}
export const accPingWwazuh = value => {
  return {
    type: 'PING_WAZUH',
    payload: value
  };
};

export function ZeekDiag(uuid) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/zeek/' + uuid + '/diag'
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/zeek/diag', params)
    dispatch(IsLoadingData(false))
    dispatch(saveZeekDiag(values.data.data))
  }
}

export function RunWazuh(uuid) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/RunWazuh/' + uuid
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/RunWazuh', params)
    dispatch(IsLoadingData(false))
    dispatch(PingWazuh(uuid))
  }
}

export function StopWazuh(uuid) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/StopWazuh/' + uuid
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/StopWazuh', params)
    dispatch(IsLoadingData(false))
    dispatch(PingWazuh(uuid))
  }
}

export function addWazuhFile(data) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/addWazuhFile',
      data:data
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/addWazuhFile', params)
    
    dispatch(IsLoadingData(false))
    dispatch(PingWazuhFiles(data.uuid))
  }
}

export function LoadFileLastLines(data) {
  return async (dispatch) => {
    var params = {
      method: "PUT",
      path: '/node/wazuh/loadLines',
      data:data
    }
    const values = await NidsRequest.genericReq('PUT', '/nids/wazuh/loadLines', params)
    
    dispatch(IsLoadingData(false))
    dispatch(accGetFile({fileContent: values.data.data.result}))
  }
}

export function deleteWazuhFile(data) {
  return async (dispatch) => {
    var params = {
      method: "DELETE",
      path: '/node/deleteWazuhFile',
      data:data
    }
    const values = await NidsRequest.genericReq('DELETE', '/nids/deleteWazuhFile', params)
    
    dispatch(IsLoadingData(false))
    dispatch(PingWazuhFiles(data.uuid))
    
  }
}

export function PingWazuhFiles(uuid) {
  return async (dispatch) => {
    var params = {
      method: "GET",      
      path: `/node/pingWazuhFiles/${uuid}`
    }
   
    const data = await NidsRequest.genericReq('PUT', '/nids/pingWazuhFiles', params);
    dispatch(accWazuhFiles(data.data.data))
  }
}
function accWazuhFiles(data) {
  return {
    type: 'WAZUH_FILES',
    payload: data
  }
};

export const saveZeekDiag = value => {
  return {
    type: 'SAVE_ZEEK_DIAG',
    payload: value
  };
};

export const savePlugins = value => {
  return {
    type: 'SAVE_PLUGINS',
    payload: value
  };
};

export const changeTabSelected = value => {
  return {
    type: 'TAB',
    payload: value
  };
};

export const NidsShowFile = value => {
  return {
    type: 'FILE',
    payload: value
  };
};

export const toggleAddNodeMenu = value => {
  return {
    type: 'ADD_NODE',
    payload: value
  };
};

export const toggleWazuhFile = value => {
  return {
    type: 'ADD_WAZUH_FILE',
    payload: value
  };
};

export const nodeForEdit = value => {
  return {
    type: 'EDIT_NODE',
    payload: value
  };
};

export const SaveNodeToDetails = value => {
  return {
    type: 'NODE_DETAILS',
    payload: value
  };
};

export const NodeDetailsTab = value => {
  return {
    type: 'NODE_TAB',
    payload: value
  };
};

export const addSuricata = value => {
  return {
    type: 'ADD_SURICATA',
    payload: value
  };
};

export const toggleAddSuricata = value => {
  return {
    type: 'TOGGLE_SURICATA',
    payload: value
  };
};

export const savePluginToEdit = value => {
  return {
    type: 'EDIT_PLUGIN',
    payload: value
  };
};

export const saveSelectedOrgs = value => {
  return {
    type: 'SAVE_ORGS',
    payload: value
  };
};

export const saveSelectedTags = value => {
  return {
    type: 'SAVE_TAGS',
    payload: value
  };
};

export const saveSelectedGroups = value => {
  return {
    type: 'SAVE_GROUPS',
    payload: value
  };
};

export const IsLoadingData = value => {
  return {
    type: 'IS_LOADING_DATA',
    payload: value
  };
};

export const toggleSocketNetwork = value => {
  return {
    type: 'TOGGLE_SOC_NET',
    payload: value
  };
};

export const toggleSocketPcap = value => {
  return {
    type: 'TOGGLE_SOC_PCAP',
    payload: value
  };
};

export const toggleNetworkSocket = value => {
  return {
    type: 'TOGGLE_NET_SOC',
    payload: value
  };
};