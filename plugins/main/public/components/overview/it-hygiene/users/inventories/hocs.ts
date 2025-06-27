import { connect } from 'react-redux';

const mapStateToProps = (state: any) => ({
  agent: state.appStateReducers.currentAgentData,
});

export const withAgent = (WrappedComponent: any) =>
  connect(mapStateToProps)(WrappedComponent);