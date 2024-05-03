import {
  routeDecoratorProtectedAdministrator,
  routeDecoratorConfigurationAPIEditable,
  compose,
} from './decorators';

const mockContext = ({
  isAdmin = false,
  isConfigurationAPIEditable = false,
}: {
  isAdmin?: boolean;
  isConfigurationAPIEditable: boolean;
}) => ({
  wazuh: {
    security: {
      getCurrentUser: () => {},
    },
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      get: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      })),
    },
  },
  wazuh_core: {
    configuration: {
      get: jest.fn(async () => isConfigurationAPIEditable),
    },
    dashboardSecurity: {
      isAdministratorUser: () => ({
        administrator: isAdmin,
        administrator_requirements: !isAdmin
          ? 'User is not administrator'
          : null,
      }),
    },
  },
});

const mockRequest = () => {
  return {};
};

const mockResponse = () => {
  const mockRes = jest.fn(data => data);
  return {
    ok: mockRes,
    forbidden: mockRes,
    custom: mockRes,
  };
};

describe('route decorator: routeDecoratorProtectedAdministrator', () => {
  it.each`
    title                     | isAdmin  | isHandlerRun | responseBodyMessage
    ${'Run handler'}          | ${true}  | ${true}      | ${null}
    ${'Avoid handler is run'} | ${false} | ${false}     | ${'403 - User is not administrator'}
  `(
    `$title`,
    async ({
      isAdmin,
      isHandlerRun,
      responseBodyMessage,
    }: {
      isAdmin: boolean;
      isHandlerRun: boolean;
      responseBodyMessage: string | null;
    }) => {
      const mockHandler = jest.fn();
      const wrappedHandler =
        routeDecoratorProtectedAdministrator(3021)(mockHandler);
      const response = await wrappedHandler(
        mockContext({ isAdmin }),
        mockRequest(),
        mockResponse(),
      );

      if (isHandlerRun) {
        expect(mockHandler).toHaveBeenCalled();
      } else {
        expect(mockHandler).not.toHaveBeenCalled();
      }

      responseBodyMessage &&
        expect(response.body.message).toBe(responseBodyMessage);
    },
  );
});

describe('route decorator: routeDecoratorConfigurationAPIEditable', () => {
  it.each`
    title                     | isConfigurationAPIEditable | isHandlerRun | responseBodyMessage
    ${'Run handler'}          | ${true}                    | ${true}      | ${null}
    ${'Avoid handler is run'} | ${false}                   | ${false}     | ${'The ability to edit the configuration from API is disabled. This can be enabled using configuration.ui_api_editable setting from the configuration file. Contact with an administrator.'}
  `(
    `$title`,
    async ({
      isConfigurationAPIEditable,
      isHandlerRun,
      responseBodyMessage,
    }: {
      isConfigurationAPIEditable: boolean;
      isHandlerRun: boolean;
      responseBodyMessage: string | null;
    }) => {
      const mockHandler = jest.fn();
      const wrappedHandler =
        routeDecoratorConfigurationAPIEditable(3021)(mockHandler);
      const response = await wrappedHandler(
        mockContext({ isConfigurationAPIEditable }),
        mockRequest(),
        mockResponse(),
      );

      if (isHandlerRun) {
        expect(mockHandler).toHaveBeenCalled();
      } else {
        expect(mockHandler).not.toHaveBeenCalled();
      }

      responseBodyMessage &&
        expect(response.body.message).toBe(responseBodyMessage);
    },
  );
});

describe('route decorators composition', () => {
  it.each`
    title                     | config                                                   | isHandlerRun | responseBodyMessage
    ${'Run handler'}          | ${{ isConfigurationAPIEditable: true, isAdmin: true }}   | ${true}      | ${null}
    ${'Avoid handler is run'} | ${{ isConfigurationAPIEditable: false, isAdmin: true }}  | ${false}     | ${'The ability to edit the configuration from API is disabled. This can be enabled using configuration.ui_api_editable setting from the configuration file. Contact with an administrator.'}
    ${'Avoid handler is run'} | ${{ isConfigurationAPIEditable: true, isAdmin: false }}  | ${false}     | ${'403 - User is not administrator'}
    ${'Avoid handler is run'} | ${{ isConfigurationAPIEditable: false, isAdmin: false }} | ${false}     | ${'The ability to edit the configuration from API is disabled. This can be enabled using configuration.ui_api_editable setting from the configuration file. Contact with an administrator.'}
  `(
    `$title`,
    async ({
      config,
      isHandlerRun,
      responseBodyMessage,
    }: {
      config: {
        isAdmin: boolean;
        isConfigurationAPIEditable: boolean;
      };
      isHandlerRun: boolean;
      responseBodyMessage: string | null;
    }) => {
      const mockHandler = jest.fn();
      const wrappedHandler = compose(
        routeDecoratorConfigurationAPIEditable(3021),
        routeDecoratorProtectedAdministrator(3021),
      )(mockHandler);
      const response = await wrappedHandler(
        mockContext(config),
        mockRequest(),
        mockResponse(),
      );

      if (isHandlerRun) {
        expect(mockHandler).toHaveBeenCalled();
      } else {
        expect(mockHandler).not.toHaveBeenCalled();
      }

      responseBodyMessage &&
        expect(response.body.message).toBe(responseBodyMessage);
    },
  );
});
