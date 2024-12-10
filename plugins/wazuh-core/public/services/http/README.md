# HTTPClient

The `HTTPClient` provides a custom mechanim to do an API request to the backend side.

This defines a request interceptor that disables the requests when `core.http` returns a response with status code 401, avoiding a problem in the login flow (with SAML).

The request interceptor is used in the clients:

- generic
- server

## Generic

This client provides a method to run the request that injects some properties related to an index pattern and selected server API host in the headers of the API request that could be used for some backend endpoints

### Usage

#### Request

```ts
plugins.wazuhCore.http.request('GET', '/api/check-api', {});
```

## Server

This client provides:

- some methods to communicate with the Wazuh server API
- manage authentication with Wazuh server API
- store the login data

### Usage

#### Authentication

```ts
plugins.wazuhCore.http.auth();
```

#### Unauthentication

```ts
plugins.wazuhCore.http.unauth();
```

#### Request

```ts
plugins.wazuhCore.http.request('GET', '/agents', {});
```

#### CSV

```ts
plugins.wazuhCore.http.csv('GET', '/agents', {});
```

#### Check API id

```ts
plugins.wazuhCore.http.checkApiById('api-host-id');
```

#### Check API

```ts
plugins.wazuhCore.http.checkApi(apiHostData);
```

#### Get user data

```ts
plugins.wazuhCore.http.getUserData();
```

The changes in the user data can be retrieved thourgh the `userData$` observable.

```ts
plugins.wazuhCore.http.userData$.subscribe(userData => {
  // do something with the data
});
```

### Register interceptor

In each application when this is mounted through the `mount` method, the request interceptor must be registered and when the application is unmounted must be unregistered.

> We should research about the possibility to register/unregister the interceptor once in the `wazuh-core` plugin instead of registering/unregisting in each mount of application.

```ts
// setup lifecycle plugin method

// Register an application
core.application.register({
  // rest of registration properties
  mount: () => {
    // Register the interceptor
    plugins.wazuhCore.http.register();
    return () => {
      // Unregister the interceptor
      plugins.wazuhCore.http.unregister();
    };
  },
});
```
