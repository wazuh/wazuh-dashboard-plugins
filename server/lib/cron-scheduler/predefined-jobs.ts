export interface IJob {
  status: boolean
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  request: string | IRequest
  params: {}
  interval: string
  index: string
  creation: 'h' | 'd' | 'w' | 'm'
  mapping?: string
  apis?: string[]
}

export interface IRequest {
  request: string
  params: {
    [key:string]: {
      request?: string
      list?: string[]
    }
  }
}

export const jobs: {[key:string]: IJob} = {
  'manager-stats-remoted': {
    status: true,
    method: "GET",
    request: '/manager/stats/remoted?pretty',
    params: {},
    interval: '0 0 * * * *',
    mapping: '{"remoted": ${data}, "cluster": "false"}',
    index: 'statistic',
    creation: 'w',
  },
  'manager-stats-analysisd': {
    status: true,
    method: "GET",
    request: '/manager/stats/analysisd?pretty',
    params: {},
    interval: '0 0 * * * *',
    mapping: '{"analysisd": ${data}, "cluster": "false"}',
    index: 'statistic',
    creation: 'w',
  },
  'cluster-stats-remoted': {
    status: true,
    method: "GET",
    request: {
      request: '/cluster/{nodeName}/stats/remoted?pretty',
      params: {
        nodeName: {
          request: '/cluster/nodes?select=name'
        }
      }
    },
    params: {},
    interval: '0 0 * * * *',
    mapping: '{"remoted": ${data}, "cluster": "true"}',
    index: 'statistic',
    creation: 'w',
  },
  'cluster-stats-analysisd': {
    status: true,
    method: "GET",
    request: {
      request: '/cluster/{nodeName}/stats/analysisd?pretty',
      params: {
        nodeName: {
          request: '/cluster/nodes?select=name'
        }
      }
    },
    params: {},
    interval: '0 0 * * * *',
    mapping: '{"analysisd": ${data}, "cluster": "true"}',
    index: 'statistic',
    creation: 'w',
  },
}