import withLoading from './loading';
import { getCurrentConfig } from '../utils/wz-fetch';

/**
 * 
 * @param {string} agentId 
 * @param {[]} sections 
 * @param {React Component} LoadingComponent 
 * @param {React Component} ErrorComponent 
 * @param {function} throwError 
 */
const withWzConfig = (agentId, sections, LoadingComponent, ErrorComponent, throwError) => (WrappedComponent) => withLoading(async () => {
  const currentConfig = await getCurrentConfig(agentId, sections);
  if(throwError){
    const error = throwError(currentConfig);
    if(error){
      throw error;
    };
  }
  return { currentConfig };
}, LoadingComponent, ErrorComponent)(WrappedComponent)

export default withWzConfig;