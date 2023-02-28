# `error-orchestrator.service`

This is a client side orchestrator error service.

## Example import

```tsx
import { getErrorOrchestrator } from '../react-services/common-services';
```

## Example usage

### Using service

```tsx
try {
  // Our code here...
  throw new Error('Some error here...');
} catch (error) {
  const options: UIErrorLog = {
    context: `${MyClass.name}.myMethodName`,
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

## Software and libraries used

- [loglevel](https://github.com/pimterry/loglevel)

## Copyright & License

Copyright &copy; 2022 Wazuh, Inc.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

Find more information about this on the [LICENSE](LICENSE) file.
