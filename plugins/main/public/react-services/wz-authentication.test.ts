import { WzAuthentication } from './wz-authentication';
import { WzRequest } from './wz-request';
import { AppState } from './app-state';

describe('Wazuh Authentication', () => {
  describe('User has agent permissions', () => {
    describe('Given a user without agent:read permission', () => {
      it('Should return true', () => {
        const policies = {};
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).toBeTruthy();
      });
    });

    describe('Given a user with read permission for all ids and groups', () => {
      it('Should return false', () => {
        const policies = {
          'agent:read': {
            'agent:id:*': 'allow',
            'agent:group:*': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).not.toBeTruthy();
      });
    });

    describe('Given a user with read permission for all ids only', () => {
      it('Should return false', () => {
        const policies = {
          'agent:read': {
            'agent:id:*': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).not.toBeTruthy();
      });
    });

    describe('Given a user with read permission for all groups only', () => {
      it('Should return false', () => {
        const policies = {
          'agent:read': {
            'agent:id:*': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).not.toBeTruthy();
      });
    });

    describe('Given a user with read permission for all ids and some ids too', () => {
      it('Should return false', () => {
        const policies = {
          'agent:read': {
            'agent:id:*': 'allow',
            'agent:id:001': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).not.toBeTruthy();
      });
    });

    describe('Given a user with read permission for all ids and some groups too', () => {
      it('Should return false', () => {
        const policies = {
          'agent:read': {
            'agent:id:*': 'allow',
            'agent:group:default': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).not.toBeTruthy();
      });
    });

    describe('Given a user with read permission for all ids but deny some ids too', () => {
      it('Should return true', () => {
        const policies = {
          'agent:read': {
            'agent:id:*': 'allow',
            'agent:id:001': 'deny',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).toBeTruthy();
      });
    });

    describe('Given a user with read permission for all groups ids but deny some groups too', () => {
      it('Should return true', () => {
        const policies = {
          'agent:read': {
            'agent:groups:*': 'allow',
            'agent:group:default': 'deny',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).toBeTruthy();
      });
    });

    describe('Given a user with read permission for some ids', () => {
      it('Should return true', () => {
        const policies = {
          'agent:read': {
            'agent:id:001': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).toBeTruthy();
      });
    });

    describe('Given a user with read permission for some groups', () => {
      it('Should return true', () => {
        const policies = {
          'agent:read': {
            'agent:groups:default': 'allow',
          },
        };
        const result = WzAuthentication.userHasAgentsPermissions(policies);
        expect(result).toBeTruthy();
      });
    });
  });
});

describe('WzAuthentication.refresh', () => {
  beforeEach(() => {
    jest
      .spyOn(AppState, 'getCurrentAPI')
      .mockReturnValue(JSON.stringify({ id: 'api-id' }));
    // No token: the refresh only logs in and deletes the existing token.
    jest
      .spyOn(WzRequest, 'genericReq')
      .mockResolvedValue({ data: { token: '' } });
    jest
      .spyOn(WzRequest, 'apiReq')
      .mockResolvedValue({ data: {} } as Awaited<
        ReturnType<typeof WzRequest.apiReq>
      >);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should send regular requests by default', async () => {
    await WzAuthentication.refresh(true);

    expect(WzRequest.genericReq).toHaveBeenCalledWith(
      'POST',
      '/api/login',
      { idHost: 'api-id', force: true },
      { asSystemRequest: false },
    );
    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'DELETE',
      '/security/user/authenticate',
      { delay: 5000 },
      { asSystemRequest: false },
    );
  });

  it('Should keep a timer-driven refresh from extending the session', async () => {
    await WzAuthentication.refresh(true, { asSystemRequest: true });

    expect(WzRequest.genericReq).toHaveBeenCalledWith(
      'POST',
      '/api/login',
      { idHost: 'api-id', force: true },
      { asSystemRequest: true },
    );
    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'DELETE',
      '/security/user/authenticate',
      { delay: 5000 },
      { asSystemRequest: true },
    );
  });
});
