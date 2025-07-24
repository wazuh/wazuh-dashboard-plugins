import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../../common/constants';
import { WzRequest } from '../../../../../react-services/wz-request';

export async function getFilterValues(
  field: string,
  agentId: string,
  policyId: string,
  filters: { [key: string]: string } = {},
  format = item => item,
) {
  const filter = {
    ...filters,
    distinct: true,
    select: field,
    sort: `+${field}`,
    limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  };
  const result = await WzRequest.apiReq(
    'GET',
    `/sca/${agentId}/checks/${policyId}`,
    {
      params: filter,
    },
  );
  return (
    result?.data?.data?.affected_items?.map(item => {
      return format(item[field]);
    }) || []
  );
}
