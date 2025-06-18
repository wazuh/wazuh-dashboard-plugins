import { IAgentResponse } from '../../../../../../common/types';
import { getAgentManagement } from '../../../../../plugin-services';

export const getAgents = async ({
  params,
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
    console.error(error);
  }
};
