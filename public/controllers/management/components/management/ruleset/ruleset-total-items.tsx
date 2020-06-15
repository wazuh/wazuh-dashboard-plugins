import React from 'react';
import withLoading from '../configuration/util-hocs/loading';
import { WzRequest } from '../../../../../react-services/wz-request';
import { EuiLoadingSpinner } from '@elastic/eui';

const sectionToAPIRequest = {
  rules: '/rules',
  decoders: '/decoders',
  lists: '/lists/files'
};

export const WzRulesetTotalItems = withLoading(
  async (props) => { /* Load function meanwhile while Loading component is rendered */
    try {
      const apiRequest = sectionToAPIRequest[props.section];
      if(apiRequest){
        const data = await WzRequest.apiReq('GET', apiRequest, {});
        const totalItems = (((data || {}).data || {}).data || {}).totalItems || undefined;
        return { totalItems };
      }
    }catch(error){
      return { totalItems: undefined, error }
    }
  },
  (props, prevProps) => props.section !== prevProps.section, /* Reload if section changed */
  () => <EuiLoadingSpinner /> /* Loading component */
)(
  (props) => props.totalItems ? <span>({props.totalItems})</span> : null /* React component after run the Load function. Render (totalItems) */
)