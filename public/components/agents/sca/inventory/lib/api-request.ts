import { WzRequest } from '../../../../../react-services/wz-request';

export async function getFilterValues(
  field,
  value,
  agentId,
  policyId,
  filters = {},
  format = (item) => item
) {
  const filter = {
    ...filters,
    distinct: true,
    select: field,
    limit: 30,
  };
  if (value) {
    filter['search'] = value;
  }
  const result = await WzRequest.apiReq('GET', `/sca/${agentId}/checks/${policyId}`, {
    params: filter,
  });
  return (
    result?.data?.data?.affected_items?.map((item) => {
      return format(item[field]);
    }) || []
  );
}
