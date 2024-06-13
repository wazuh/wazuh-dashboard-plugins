import { withGuardAsync } from './withGuard';
import { zipObject, values, keys } from 'lodash';

const promiseAllValues = async object =>
  zipObject(keys(object), await Promise.all(values(object)));

export const withRouteResolvers = (
  resolvers: { [key: string]: Function },
  ...rest
) =>
  withGuardAsync(async props => {
    try {
      const data = await promiseAllValues(
        Object.fromEntries(
          Object.entries(resolvers).map(([key, value]) => [
            key,
            Promise.resolve(value(props)),
          ]),
        ),
      );
      return { ok: false, data };
    } catch (error) {
      return { ok: true, error };
    }
  }, ...rest);
