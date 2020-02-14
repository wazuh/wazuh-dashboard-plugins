export interface IJob {
  status: boolean
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  request: string
  params: {}
  interval: string
  index: string
  creation: 'h' | 'd' | 'w' | 'm'
  apis?: string[]
}

export const jobs: IJob[] = [
  {
    status: true,
    method: "GET",
    request: '/version',
    params: {},
    interval: '* * * * * *',
    index: 'version',
    creation: 'w',
  },
  {
    status: true,
    method: "GET",
    request: '/manager/status',
    params: {},
    interval: '* * * * * *',
    index: 'manager-stats',
    creation: 'w',
  },
  {
    status: true,
    method: "GET",
    request: '/manager/stats/remoted?pretty',
    params: {},
    interval: '* * * * * *',
    index: 'manager-stats',
    creation: 'w',
  },
]