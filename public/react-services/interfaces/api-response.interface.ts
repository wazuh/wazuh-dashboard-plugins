import { AgentsSummary } from '../../components/common/hooks/types';

interface IData<T>  {
  affected_items: Array<T>;
  failed_items: Array<any>;
  total_affected_items: number;
  total_failed_items: number;
} 

interface IResponseData<T> {
  data: IData<T> | AgentsSummary;
  message: string;
  error: number;
}

export default interface IApiResponse<T> {
  data: IResponseData<T>;
} 
