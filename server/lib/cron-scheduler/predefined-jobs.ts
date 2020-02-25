export interface IJob {
  status: boolean
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  request: string | IRequest
  params: {}
  interval: string
  index: string
  creation: 'h' | 'd' | 'w' | 'm'
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
    index: 'manager-stats-remoted',
    creation: 'w',
  },
  'manager-stats-analysisd': {
    status: true,
    method: "GET",
    request: '/manager/stats/analysisd?pretty',
    params: {},
    interval: '0 0 * * * *',
    index: 'manager-stats-analysisd',
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
    index: 'cluster-stats-remoted',
    creation: 'w',
  },
  'cluster-stats-cluster': {
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
    index: 'cluster-stats-analysisd',
    creation: 'w',
  },
}