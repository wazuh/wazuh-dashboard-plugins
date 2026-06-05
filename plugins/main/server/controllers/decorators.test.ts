import { routeDecoratorProtectedAdministrator, compose } from './decorators';

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

describe('route decorators composition', () => {
  it.each`
    title                     | config                | isHandlerRun | responseBodyMessage
    ${'Run handler'}          | ${{ isAdmin: true }}  | ${true}      | ${null}
    ${'Avoid handler is run'} | ${{ isAdmin: false }} | ${false}     | ${'403 - User is not administrator'}
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
