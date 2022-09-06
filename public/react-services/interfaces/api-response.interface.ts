interface IData<T> {
  affected_items: Array<T>;
  failed_items: Array<any>;
  total_affected_items: number;
  total_failed_items: number;
}

// /cluster/status interface
interface IData<T> {
  enabled: string;
  running: string;
}

interface IResponseData<T> {
  data: IData<T>;
  message: string;
  error: number;
}

export default interface IApiResponse<T> {
  data: IResponseData<T>;
}
