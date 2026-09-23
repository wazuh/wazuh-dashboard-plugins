import React from 'react';
import { EuiCompressedFormRow, EuiCompressedSwitch } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { Engine } from './types';

export type UpdateEngineFn = <K extends keyof Engine>(
  key: K,
  value: Engine[K],
) => void;

export function EngineSwitch({
  field,
  ariaLabel,
  engine,
  updateEngine,
  saving,
}: {
  field: keyof Engine;
  ariaLabel: string;
  engine: Engine;
  updateEngine: UpdateEngineFn;
  saving: boolean;
}) {
  const value = engine[field];
  const checked = typeof value === 'boolean' ? value : Boolean(value);

  return (
    <EuiCompressedFormRow fullWidth>
      <EuiCompressedSwitch
        label={
          checked
            ? i18n.translate('wazuh.indexerSettings.engineSwitch.onLabel', {
                defaultMessage: 'On',
              })
            : i18n.translate('wazuh.indexerSettings.engineSwitch.offLabel', {
                defaultMessage: 'Off',
              })
        }
        checked={checked}
        onChange={() => updateEngine(field, !checked as Engine[typeof field])}
        disabled={saving}
        aria-label={ariaLabel}
      />
    </EuiCompressedFormRow>
  );
}
