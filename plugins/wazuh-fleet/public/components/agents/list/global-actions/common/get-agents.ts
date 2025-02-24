import { IAgentResponse } from '../../../../../../common/types';
import { getAgentManagement } from '../../../../../plugin-services';

export const getAgents = async ({
  params,
  setGetAgentsStatus,
  setGetAgentsError,
}: {
  params: object;
  setGetAgentsStatus: (state: string) => void;
  setGetAgentsError: (error: any) => void;
}) => {
  try {
    const { hits: results }: { hits: IAgentResponse } =
      await getAgentManagement().getAll(params);

    return results;
  } catch (error: any) {
    setGetAgentsStatus('danger');
    setGetAgentsError(error);
  }
};
