const initialState = { section: '' };

const managementReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_MANAGEMENT_SECTION') {
    return {
      ...state,
      section: action.section
    };
  }

  return state;
};

export default managementReducers;
