import { connect } from 'react-redux';

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData,
});

/**
 * Higher-Order Component (HOC) that injects the `agent` object
 * into the wrapped component via props.
 *
 * Initially, the `agent` object is empty (`{}`) until an agent is selected.
 * Once an agent is selected, the `agent` prop contains detailed information about the agent selected
 *
 * @param {React.ComponentType} WrappedComponent - El componente al que se le inyectarán los datos del agente.
 * @returns {React.ComponentType} - El componente conectado con la prop `agent`.
 */
export const withAgent = WrappedComponent =>
  connect(mapStateToProps)(WrappedComponent);
