import { IIndexConfiguration } from './index';

export interface IJob {
  status: boolean
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  request: string | IRequest
  params: {}
  interval: string
  index: IIndexConfiguration
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
    interval: '*/5 * * * * *',
    index: {
      name: 'statistic',
      creation: 'w',
      mapping: '{"remoted": ${data}, "apiName": ${apiName}, "cluster": "false"}',
    }
  },
  'manager-stats-analysisd': {
    status: true,
    method: "GET",
    request: '/manager/stats/analysisd?pretty',
    params: {},
    interval: '*/5 * * * * *',
    index: {
      name: 'statistic',
      creation: 'w',
      mapping: '{"analysisd": ${data}, "apiName": ${apiName}, "cluster": "false"}',
    }
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
    interval: '*/5 * * * * *',
    index: {
      name:'statistic',
      creation: 'w',
      mapping: '{"remoted": ${data}, "apiName": ${apiName}, "nodeName": ${nodeName}, "cluster": "true"}',
    }
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
    interval: '*/5 * * * * *',
    index: {
      name: 'statistic',
      creation: 'w',
      mapping: '{"analysisd": ${data}, "apiName": ${apiName}, "nodeName": ${nodeName}, "cluster": "true"}',
    }
  },
}