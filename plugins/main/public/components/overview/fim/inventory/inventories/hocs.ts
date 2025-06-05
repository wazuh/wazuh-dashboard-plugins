import { connect } from 'react-redux';

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData,
});

export const withAgent = WrappedComponent =>
  connect(mapStateToProps)(WrappedComponent);
