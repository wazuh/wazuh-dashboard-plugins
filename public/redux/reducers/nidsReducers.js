const initialState = {
    interfaces: {},
    rulesets: {},
    tabSelected: "nodes",
    nodeTabSelected: "suricata",
    nodeToEdit: "",
    nodeDetail: {},
    tags: {},
    orgs: {},
    groups: {},
    nodePlugins: {},
    editPlugin: {},
    addNodeForm: false,
    toggleSuricata: false,
    nodes: [],
    savedOrgs: [],
    savedTags: [],
    savedGroups: [],
    zeekData: {},
  };
  
  const nidsReducers = (state = initialState, action) => {
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