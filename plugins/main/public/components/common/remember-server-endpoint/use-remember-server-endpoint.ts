import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EnhancedFieldConfiguration } from '../form/types';
import { getUiSettings } from '../../../kibana-services';
import { ErrorHandler } from '../../../react-services/error-management/error-handler/error-handler';
import { updateAppConfig } from '../../../redux/actions/appConfigActions';

export interface ServerEndpointFields {
  address: EnhancedFieldConfiguration;
  port: EnhancedFieldConfiguration;
  path: EnhancedFieldConfiguration;
}

/* The agent takes the address, the port and the path prefix as a single
endpoint, but the forms ask for them separately so each keeps the validation
that fits it -- a combined string could no longer be checked as a hostname. They
are remembered together: a remembered address whose port or prefix was dropped
would prefill an endpoint the operator never used. */
const SERVER_ENDPOINT_SETTINGS = [
  { field: 'address', setting: 'enrollment.dns' },
  { field: 'port', setting: 'enrollment.port' },
  { field: 'path', setting: 'enrollment.path' },
] as const;

export const useRememberServerEndpoint = (fields: ServerEndpointFields) => {
  const dispatch = useDispatch();
  const [isRemembered, setIsRemembered] = useState(false);
  /* What was last saved, so returning to the form shows the switch already on
  for the endpoint it is prefilled with. */
  const [savedEndpoint, setSavedEndpoint] = useState<unknown[]>(() =>
    SERVER_ENDPOINT_SETTINGS.map(
      ({ field }) => fields[field]?.initialValue ?? '',
    ),
  );
  const currentEndpoint = SERVER_ENDPOINT_SETTINGS.map(
    ({ field }) => fields[field].value,
  );

  const save = async (): Promise<boolean> => {
    try {
      // WORKAROUND: this could be done through the getWazuhCorePlugin().configuration but it requires the addition of a setter method
      const saved = await Promise.all(
        SERVER_ENDPOINT_SETTINGS.map(({ field, setting }) =>
          getUiSettings().set(setting, fields[field].value),
        ),
      );
      /* `set` reports a refused save by returning `false`, after its own toast. */
      if (saved.includes(false)) {
        return false;
      }
      /* The settings reach the store only when the app config is loaded, so
      what is read from it would stay stale until a reload. */
      dispatch(
        updateAppConfig(
          Object.fromEntries(
            SERVER_ENDPOINT_SETTINGS.map(({ field, setting }) => [
              setting,
              fields[field].value,
            ]),
          ),
        ),
      );
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, {
        message: error.message,
        title: i18n.translate(
          'wazuh.common.rememberServerEndpoint.saveErrorTitle',
          { defaultMessage: 'Error saving the server endpoint configuration' },
        ),
      });
      return false;
    }
  };

  const onToggle = async (checked: boolean) => {
    setIsRemembered(checked);
    if (!checked) {
      return;
    }
    if (await save()) {
      setSavedEndpoint(currentEndpoint);
    } else {
      setIsRemembered(false);
    }
  };

  const isDisabled =
    !fields.address.value ||
    SERVER_ENDPOINT_SETTINGS.some(({ field }) => !!fields[field].error);

  /* Editing any of the three after saving takes the endpoint away from what was
  remembered. Turning the switch off is left standing until then, which is why
  this is an effect and not a value derived on every render. */
  useEffect(() => {
    setIsRemembered(
      currentEndpoint.every((value, index) => value === savedEndpoint[index]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...currentEndpoint, savedEndpoint]);

  return { isRemembered, isDisabled, onToggle };
};
