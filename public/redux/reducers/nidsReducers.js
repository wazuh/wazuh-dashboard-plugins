const initialState = {
    interfaces: {},
    rulesets: {},
    tabSelected: "nodes",
    nodeTabSelected: "overview",
    nodeToEdit: "",
    file: "",
    nodeDetail: {},
    tags: {},
    orgs: {},
    groups: {},
    nodePlugins: {},
    editPlugin: {},
    addNodeForm: false,
    toggleSuricata: false,
    toggleAddWazuhFile: false,
    loadingData: false,
    showSocNet: '',
    showSocPcap: '',
    showNetSoc: '',
    nodes: [],
    savedOrgs: [],
    savedTags: [],
    savedGroups: [],
    zeekData: {},
    zeekDiag: {},
    fileContent: {},
    analyzer: {},
    wazuhFiles: {},
    wazuhData: {},
    mainConfData: {},
    mainServiceStatus: {},
  };
  
  const nidsReducers = (state = initialState, action) => {
      if (action.type === 'MAIN_CONF_DATA') {
        return {
          ...state,
          mainConfData: action.payload
        };
      }  
      if (action.type === 'CHANGE_MAIN_SERVICE_STATUS') {
        return {
          ...state,
          mainServiceStatus: action.payload
        };
      }  
      if (action.type === 'PING_WAZUH') {
        return {
          ...state,
          wazuhData: action.payload
        };
      }  
      if (action.type === 'ADD_WAZUH_FILE') {
        return {
          ...state,
          toggleAddWazuhFile: action.payload
        };
      }  
      if (action.type === 'WAZUH_FILES') {
        return {
          ...state,
          wazuhFiles: action.payload
        };
      }  
      if (action.type === 'ANALYZER') {
        return {
          ...state,
          analyzer: action.payload
        };
      }  
      if (action.type === 'TOGGLE_NET_SOC') {
        return {
          ...state,
          showNetSoc: action.payload
        };
      }  
      if (action.type === 'TOGGLE_SOC_PCAP') {
        return {
          ...state,
          showSocPcap: action.payload
        };
      }  
      if (action.type === 'TOGGLE_SOC_NET') {
        return {
          ...state,
          showSocNet: action.payload
        };
      }  
      if (action.type === 'FILE_CONTENT') {
        return {
          ...state,
          fileContent: action.payload
        };
      }  
      if (action.type === 'FILE') {
        return {
          ...state,
          file: action.payload
        };
      }  
      if (action.type === 'SAVE_ZEEK_DIAG') {
        return {
          ...state,
          zeekDiag: action.payload
        };
      }  
      if (action.type === 'IS_LOADING_DATA') {
        return {
          ...state,
          loadingData: action.payload
        };
      }  
      if (action.type === 'ZEEK') {
        return {
          ...state,
          zeekData: action.payload
        };
      }  
      if (action.type === 'SAVE_GROUPS') {
        return {
          ...state,
          savedGroups: action.payload
        };
      }  
      if (action.type === 'SAVE_ORGS') {
        return {
          ...state,
          savedOrgs: action.payload
        };
      }  
      if (action.type === 'SAVE_TAGS') {
        return {
          ...state,
          savedTags: action.payload
        };
      }  
      if (action.type === 'RULESETS') {
        return {
          ...state,
          rulesets: action.payload
        };
      }  
      if (action.type === 'GROUPS') {
        return {
          ...state,
          groups: action.payload
        };
      }  
      if (action.type === 'TAGS') {
        return {
          ...state,
          tags: action.payload
        };
      }  
      if (action.type === 'ORGS') {
        return {
          ...state,
          orgs: action.payload
        };
      }  
      if (action.type === 'TAB') {
        return {
          ...state,
          tabSelected: action.payload
        };
      }  
      if (action.type === 'ADD_NODE') {
        return {
          ...state,
          addNodeForm: action.payload
        };
      }  
      if (action.type === 'NODES') {
        return {
          ...state,
          nodes: action.payload
        };
      }  
      if (action.type === 'EDIT_NODE') {
        return {
          ...state,
          nodeToEdit: action.payload
        };
      }  
      if (action.type === 'NODE_TAB') {
        return {
          ...state,
          nodeTabSelected: action.payload
        };
      }  
      if (action.type === 'NODE_DETAILS') {
        return {
          ...state,
          nodeDetail: action.payload
        };
      }  
      if (action.type === 'SAVE_PLUGINS') {
        return {
          ...state,
          nodePlugins: action.payload
        };
      }  
      if (action.type === 'TOGGLE_SURICATA') {
        return {
          ...state,
          toggleSuricata: action.payload
        };
      }  
      if (action.type === 'EDIT_PLUGIN') {
        return {
          ...state,
          editPlugin: action.payload
        };
      }  
      if (action.type === 'INTERFACES') {
        return {
          ...state,
          interfaces: action.payload
        };
      }  
      return state;
    };
    
    export default nidsReducers;