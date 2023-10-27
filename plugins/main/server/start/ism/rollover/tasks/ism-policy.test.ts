import {
  ISM_ROLLOVER_POLICY_FILE,
  ISM_ROLLOVER_POLICY_NAME,
} from '../../../../../common/constants';
import taskRolloverISMPolicy from './ism-policy';

const policies = {
  another_rollover_alerts: {
    _id: 'another_rollover_alerts',
    policy: {
      description: 'Roll over policy',
      default_state: 'initial',
      states: [
        {
          name: 'initial',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-alerts-*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  another_rollover_archives: {
    _id: 'another_rollover_archives',
    policy: {
      description: 'Roll over policy',
      default_state: 'initial',
      states: [
        {
          name: 'initial',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-archives-*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  another_rollover_alerts_archives: {
    _id: 'another_rollover_alerts_archives',
    policy: {
      description: 'Roll over policy',
      default_state: 'initial',
      states: [
        {
          name: 'initial',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-alerts-*', 'wazuh-archives-*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  another_rollover_alerts_no_alerts_sample: {
    _id: 'another_rollover_alerts_no_alerts_sample',
    policy: {
      description: 'Roll over policy',
      default_state: 'initial',
      states: [
        {
          name: 'initial',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-alerts-*', '-wazuh-alerts-4.x-sample*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  another_rollover_alerts_archives_no_alerts_sample: {
    _id: 'another_rollover_alerts_no_alerts_sample',
    policy: {
      description: 'Roll over policy',
      default_state: 'initial',
      states: [
        {
          name: 'initial',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: [
          'wazuh-alerts-*',
          'wazuh-archives-*',
          '-wazuh-alerts-4.x-sample*',
        ],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  default_rollover_alerts: {
    _id: ISM_ROLLOVER_POLICY_NAME,
    policy: {
      description: 'Default roll over policy',
      default_state: 'active',
      states: [
        {
          name: 'active',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-alerts-*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  default_rollover_archives: {
    _id: ISM_ROLLOVER_POLICY_NAME,
    policy: {
      description: 'Default roll over policy',
      default_state: 'active',
      states: [
        {
          name: 'active',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-archives-*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
  default_rollover_alerts_archives: {
    _id: ISM_ROLLOVER_POLICY_NAME,
    policy: {
      description: 'Default roll over policy',
      default_state: 'active',
      states: [
        {
          name: 'active',
          actions: [
            {
              rollover: {},
            },
          ],
        },
      ],
      ism_template: {
        index_patterns: ['wazuh-alerts-*', 'wazuh-archives-*'],
        priority: 25,
      },
    },
    _seq_no: 1,
    _primary_term: 1,
  },
};

const configs = {
  '1': {
    'ism.rollover.index_patterns': [
      'wazuh-alerts-*',
      'wazuh-archives-*',
      '-wazuh-alerts-4.x-sample*',
    ],
    'ism.rollover.min_index_age': '30d',
    'ism.rollover.min_primary_shard_size': 20,
    'ism.rollover.min_doc_count': 200000000,
    'ism.rollover.overwrite': false,
    'ism.rollover.priority': 20,
  },
  '2': {
    'ism.rollover.index_patterns': [
      'wazuh-alerts-*',
      'wazuh-archives-*',
      '-wazuh-alerts-4.x-sample*',
    ],
    'ism.rollover.min_index_age': '45d',
    'ism.rollover.min_primary_shard_size': 30,
    'ism.rollover.min_doc_count': 250000000,
    'ism.rollover.overwrite': true,
    'ism.rollover.priority': 10,
  },
};

describe('Task:Roll over Index State Management:check roll over create ISM policy', () => {
  it.each([
    [
      'Create ISM policy. No initial policies.',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [],
        finalPolicies: [
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '20gb',
                          min_index_age: '30d',
                          min_doc_count: 200000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: [
                    'wazuh-alerts-*',
                    'wazuh-archives-*',
                    '-wazuh-alerts-4.x-sample*',
                  ],
                  priority: 20,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['1'],
      },
    ],
    [
      'Create ISM policy. Initial roll over policy for alerts index pattern. The default policy is created for the rest of index patterns.',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [policies.another_rollover_alerts],
        finalPolicies: [
          policies.another_rollover_alerts,
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '20gb',
                          min_index_age: '30d',
                          min_doc_count: 200000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: [
                    'wazuh-archives-*',
                    '-wazuh-alerts-4.x-sample*',
                  ],
                  priority: 20,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['1'],
      },
    ],
    [
      'Create ISM policy. Initial roll over policy for archives index pattern. The default policy is created for the rest of index patterns.',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [policies.another_rollover_archives],
        finalPolicies: [
          policies.another_rollover_archives,
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '20gb',
                          min_index_age: '30d',
                          min_doc_count: 200000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: [
                    'wazuh-alerts-*',
                    '-wazuh-alerts-4.x-sample*',
                  ],
                  priority: 20,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['1'],
      },
    ],
    [
      'Create ISM policy. Initial roll over policy for alerts and no alerts sample index patterns. The default policy is created for the rest of index patterns.',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [policies.another_rollover_alerts_no_alerts_sample],
        finalPolicies: [
          policies.another_rollover_alerts_no_alerts_sample,
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '20gb',
                          min_index_age: '30d',
                          min_doc_count: 200000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: ['wazuh-archives-*'],
                  priority: 20,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['1'],
      },
    ],
    [
      'Create ISM policy. Initial roll over policy for alerts, archives and no alerts sample of the index patterns. The default policy is not created.',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [
          policies.another_rollover_alerts_archives_no_alerts_sample,
        ],
        finalPolicies: [
          policies.another_rollover_alerts_archives_no_alerts_sample,
        ],
        config: configs['1'],
      },
    ],
    [
      'Create ISM policy. No initial policies. The default policy is created for the rest of index patterns. Overwrite: true',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [],
        finalPolicies: [
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '30gb',
                          min_index_age: '45d',
                          min_doc_count: 250000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: [
                    'wazuh-alerts-*',
                    'wazuh-archives-*',
                    '-wazuh-alerts-4.x-sample*',
                  ],
                  priority: 10,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['2'],
      },
    ],
    [
      'Create ISM policy. Initial default roll over policy with alerts index pattern. The default policy is updated adding the current configuration. Overwrite: true',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [policies.default_rollover_alerts],
        finalPolicies: [
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '30gb',
                          min_index_age: '45d',
                          min_doc_count: 250000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: [
                    'wazuh-alerts-*',
                    'wazuh-archives-*',
                    '-wazuh-alerts-4.x-sample*',
                  ],
                  priority: 10,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['2'],
      },
    ],
    [
      'Create ISM policy. Initial default roll over policy with alerts index pattern. The default policy is updated adding the current configuration. Overwrite: true',
      {
        policy: {
          name: ISM_ROLLOVER_POLICY_NAME,
          path: ISM_ROLLOVER_POLICY_FILE,
        },
        initialPolicies: [policies.default_rollover_alerts_archives],
        finalPolicies: [
          {
            _id: 'rollover_policy',
            policy: {
              policy: {
                description: 'Wazuh rollover and alias policy',
                default_state: 'active',
                states: [
                  {
                    name: 'active',
                    actions: [
                      {
                        rollover: {
                          min_primary_shard_size: '30gb',
                          min_index_age: '45d',
                          min_doc_count: 250000000,
                        },
                      },
                    ],
                  },
                ],
                ism_template: {
                  index_patterns: [
                    'wazuh-alerts-*',
                    'wazuh-archives-*',
                    '-wazuh-alerts-4.x-sample*',
                  ],
                  priority: 10,
                },
              },
            },
            _seq_no: 1,
            _primary_term: 1,
          },
        ],
        config: configs['2'],
      },
    ],
  ])(
    '%s',
    async (title, { policy, initialPolicies, finalPolicies, config }) => {
      let currentPolicies = [...initialPolicies];

      // Mock context
      const context = {
        wazuh: {
          logger: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        job: {
          policy: policy,
        },
      };

      const opensearchClient = {
        callAsInternalUser: jest
          .fn()
          .mockImplementation(async (key, params) => {
            const { body, policyId, ifSeqNo, ifPrimaryTerm } = params || {};
            switch (key) {
              case 'wzISM.getPolicies': {
                return { policies: currentPolicies };
                break;
              }
              case 'wzISM.createPolicy':
                if ([body, policyId].some(key => !key)) {
                  throw new Error('error');
                } else {
                  currentPolicies.push({
                    _id: policyId,
                    policy: JSON.parse(body),
                    _seq_no: ifSeqNo || 1,
                    _primary_term: ifPrimaryTerm || 1,
                  });
                  return params;
                }
                break;
              case 'wzISM.putPolicy':
                if (
                  [body, policyId, ifSeqNo, ifPrimaryTerm].some(key => !key)
                ) {
                  throw new Error('error');
                } else {
                  currentPolicies = currentPolicies.filter(
                    ({ _id }) => _id !== policyId,
                  );
                  currentPolicies.push({
                    _id: policyId,
                    policy: JSON.parse(body),
                    _seq_no: ifSeqNo,
                    _primary_term: ifPrimaryTerm,
                  });
                  return params;
                }
                break;
              default: {
              }
            }
          }),
      };

      await taskRolloverISMPolicy(context, {
        opensearchClient: opensearchClient,
        config,
      });

      expect(opensearchClient.callAsInternalUser).toHaveBeenCalledWith(
        'wzISM.getPolicies',
      );
      // // Ensure the current policies is equal to the final policies
      expect(currentPolicies).toEqual(finalPolicies);
    },
  );
});
