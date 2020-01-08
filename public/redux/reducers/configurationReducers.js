const initialState = { section: '', wazuhNotReadyYet: false };

const configurationReducers = (state = initialState, action) => {
  switch(action.type){
    case 'UPDATE_CONFIGURATION_SECTION':
      return {
        ...state,
        section: action.section
      }
    case 'UPDATE_WAZUH_NOT_READY_YET':
      return {
        ...state,
        wazuhNotReadyYet: action.wazuhNotReadyYet
      } 
    default:
      return state
  }
};

export default configurationReducers;
