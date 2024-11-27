# State

The `state` service manages the shared state of the Wazuh plugins and it is a HUB of state containers. Features:

- Extensible
- Register state containers
- Ability to get, set, remove data and subscribe to changes of state containers

The state containers provides a mechanism to manage a specific state. For example, some data is stored in cookies, others could be managed in-memory, local storage, session storage.

Others plugins can register new state containers.

The service creates hooks and HOCs that are exposed through the plugin lifecycle.

## Usage

### Register a state container

```ts
state.register('my_state', new MyStateContainer(logger, deps));
```

### Get data of a state container

```ts
state.get('my_state');
```

### Set data of a state container

```ts
state.set('my_state', newMyState);
```

### Remove data of a state container

```ts
state.remove('my_state', newMyState);
```

### Subscribe to a state container

```ts
state.subscribe('my_state', data => {
  // Do something with the data
});
```

### Hooks

#### useStateContainer

Use the state container.

```ts
const [value, { set: setValue, remove: removeValue }] =
  useStateContainter('my_state_container');
```

### HOCs

#### withStateContainer

Use the state container.

```tsx
const MyComponent = withStateContainer('my_state_container')(props => {
  const getStateContainerValue = () => {
    // access to state container value
    return props['stateContainer:my_state_container'].value;
  };

  const setStateContainterValue = newValue => {
    // set a new value
    props['stateContainer:my_state_container'].set(newValue);
  };

  const removeStateContainerValue = () => {
    // remove the value
    props['stateContainer:my_state_container'].remove();
  };
});
```
