/*
 * PROTOTYPE (issue #9672) — throwaway. Picks a variant from `variant=` in the
 * URL hash query (`#/overview/?...&variant=B`); ← / → or the bar switch it.
 */
import React, { useEffect, useState } from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { VARIANTS, VariantProps } from './variants';
import {
  usePrototypeCases,
  usePrototypeIncidentResponse,
} from './use-prototype-data';

const KEYS = Object.keys(VARIANTS);

const readVariant = () => {
  const match = window.location.hash.match(/[?&]variant=([A-Z])/);
  return match && KEYS.includes(match[1]) ? match[1] : 'A';
};

const writeVariant = (key: string) => {
  const hash = window.location.hash;
  const next = /[?&]variant=[A-Z]/.test(hash)
    ? hash.replace(/([?&])variant=[A-Z]/, `$1variant=${key}`)
    : `${hash}${hash.includes('?') ? '&' : '?'}variant=${key}`;
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}${next}`,
  );
};

const PrototypeSwitcher: React.FC<{
  current: string;
  onChange: (k: string) => void;
}> = ({ current, onChange }) => {
  const step = (d: number) =>
    onChange(KEYS[(KEYS.indexOf(current) + d + KEYS.length) % KEYS.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest?.('input, textarea, [contenteditable="true"]')) {
        return;
      }
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: '#111',
        color: '#fff',
        borderRadius: 999,
        boxShadow: '0 4px 16px rgba(0,0,0,.35)',
        fontSize: 13,
      }}
    >
      <EuiButtonIcon
        iconType='arrowLeft'
        color='ghost'
        aria-label='Previous variant'
        onClick={() => step(-1)}
      />
      <span>
        PROTOTYPE · <strong>{current}</strong> ({VARIANTS[current].displayName})
      </span>
      <EuiButtonIcon
        iconType='arrowRight'
        color='ghost'
        aria-label='Next variant'
        onClick={() => step(1)}
      />
    </div>
  );
};

export const PrototypeResponseRow: React.FC<{
  current: VariantProps['current'];
  findings: VariantProps['findings'];
}> = ({ current, findings }) => {
  const [variant, setVariant] = useState(readVariant);
  const ir = usePrototypeIncidentResponse();
  const cases = usePrototypeCases();
  const Variant = VARIANTS[variant];
  return (
    <>
      <Variant ir={ir} cases={cases} current={current} findings={findings} />
      {process.env.NODE_ENV !== 'production' && (
        <PrototypeSwitcher
          current={variant}
          onChange={k => {
            writeVariant(k);
            setVariant(k);
          }}
        />
      )}
    </>
  );
};
