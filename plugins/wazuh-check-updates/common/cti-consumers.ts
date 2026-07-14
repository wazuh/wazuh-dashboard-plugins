/** A single consumer document from the `.wazuh-cti-consumers` internal index. */
export interface CtiConsumer {
  name: string;
  context: string;
  type: string;
  resource: string;
  is_public: boolean;
  status: string;
  local_offset: number;
  remote_offset: number;
}

export interface CtiConsumersResponse {
  data: CtiConsumer[];
}
