const initialState = {
  section: '',
  clusterNodes: false,
  clusterNodeSelected: false,
  refreshTime: false
};

const configurationReducers = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_CONFIGURATION_SECTION':
      return {
        ...state,
        section: action.section
      };
    case 'UPDATE_CONFIGURATION_CLUSTER_NODES':
      return {
        ...state,
        clusterNodes: action.clusterNodes
      };
    case 'UPDATE_CONFIGURATION_CLUSTER_NODE_SELECTED':
      return {
        ...state,
        clusterNodeSelected: action.clusterNodeSelected
      };
    case 'UPDATE_CONFIGURATION_REFRESH_TIME':
      return {
        ...state,
        refreshTime: new Date()
      };
    default:
      return state;
  }
};

export default configurationReducers;
