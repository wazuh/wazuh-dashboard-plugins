export interface job {
  status: boolean
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  request: string
  params: {}
  interval: string
  index: string
  creation: 'h' | 'd' | 'w' | 'm'
  apis?: string[]
}

export const jobs: job[] = [
  {
    status: true,
    method: "GET",
    request: '/manager/stats/remoted?pretty',
    params: {},
    interval: '0 */2 * * * *',
    index: 'managet-stats',
    creation: 'w',
  },
]