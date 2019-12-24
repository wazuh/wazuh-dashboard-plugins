const initialState = { tab: '' };

const configurationReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_CONFIGURATION_SECTION') {
    return {
      ...state,
      section: action.section
    };
  }

  return state;
};

export default configurationReducers;
