const initialState = { section: '' };

export default (state = initialState, action) => {
  if (action.type === 'UPDATE_MANAGEMENT_SECTION') {
    return {
      ...state,
      section: action.section
    };
  }

  return state;
};

export const changeManagementSection = state => state.managementReducers.section;
