# `error-orchestrator.service`

This is a client side orchestrator error service.

## Example import

```tsx
import { createGetterSetter } from '../utils/create-getter-setter';
```

## Example usage

### Using service

```tsx
try {
  // Our code here...
  throw new Error('Some error here...');
} catch (error) {
  const options: UIErrorLog = {
    context: 'contextError',
    level: UI_LOGGER_LEVELS.WARNING,
    severity: UI_ERROR_SEVERITIES.BUSINESS,
    display: true,
    store: true,
    error: {
      error: error,
      message: error.message,
      title: error.name,
    },
  };

  getErrorOrchestrator().handleError(options);
}
```

The `options` object may contain:

- `context: string` (defaults to "" and not required) - to give more precision about location of the error.
- `level: UILogLevel` ([UILogLevel](./types.ts) - WARNING | INFO | ERROR) to determine the error type.
- `severity: UIErrorSeverity` ([UIErrorSeverity](./types.ts) UI | BUSINESS | CRITICAL) - to indicate that the class must use factory.
- `display: boolean` (default true) - to show the error to the user in UI.
- `store: boolean` (default false) - Used to stored by request [POST] on our logs (wazuh-ui-plain.log).
- `error: Error` - error caught, message and title to show on UI o store on logs.

## Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to [wazuh+subscribe@googlegroups.com](mailto:wazuh+subscribe@googlegroups.com), to ask questions and participate in discussions.

## Software and libraries used

- [Elastic](https://elastic.co)
- [Elastic UI framework](https://elastic.github.io/eui)
- [loglevel](https://github.com/pimterry/loglevel)
- [Jest](https://jestjs.io/)
- [Node.js](https://nodejs.org)
- [NPM](https://npmjs.com)

## Copyright & License

Copyright &copy; 2021 Wazuh, Inc.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

Find more information about this on the [LICENSE](LICENSE) file.
