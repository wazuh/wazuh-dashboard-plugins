const initialState = {
    interfaces: {},
    rulesets: {},
    tabSelected: "nodes",
    nodeTabSelected: "suricata",
    nodeToEdit: "",
    nodeDetail: {},
    nodePlugins: {},
    editPlugin: {},
    addNodeForm: false,
    toggleSuricata: false,
    nodes: [],
  };
  
  const nidsReducers = (state = initialState, action) => {
      if (action.type === 'RULESETS') {
        return {
          ...state,
          rulesets: action.payload
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