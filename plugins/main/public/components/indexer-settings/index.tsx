import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiDescribedFormGroup,
  EuiLoadingSpinner,
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiPageBody,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
} from '@elastic/eui';
import { getToasts } from '../../kibana-services';
import { GenericRequest } from '../../react-services';
import { EngineSwitch } from './engine-switch';
import type { Engine, IndexerSettings } from './types';

export const WzIndexerSettings: React.FC = () => {
  const [savedSettings, setSavedSettings] = useState<IndexerSettings | null>(
    null,
  );
  const [draftSettings, setDraftSettings] = useState<IndexerSettings | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bottomBarHost, setBottomBarHost] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setBottomBarHost(document.getElementById('app-wrapper') ?? document.body);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await GenericRequest.request<{ data: IndexerSettings }>(
        'GET',
        '/indexer/settings',
      );

      const settings = response.data;
      setSavedSettings(settings);
      setDraftSettings(settings);
    } catch (error: any) {
      setSavedSettings(null);
      setDraftSettings(null);
      setLoadError(error?.message || 'Error fetching settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateEngine = useCallback(
    <K extends keyof Engine>(key: K, value: Engine[K]) => {
      setDraftSettings(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          engine: { ...prev.engine, [key]: value },
        };
      });
    },
    [],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (savedSettings === null || draftSettings === null) {
      return false;
    }

    return (
      savedSettings.engine.index_raw_events !==
      draftSettings.engine.index_raw_events
    );
  }, [savedSettings, draftSettings]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const cancelChanges = () => {
    if (savedSettings === null) return;
    setDraftSettings(savedSettings);
  };

  const saveChanges = async () => {
    if (draftSettings === null) return;
    setSaving(true);
    try {
      await GenericRequest.request('PUT', '/indexer/settings', draftSettings);

      setSavedSettings(draftSettings);
      getToasts().addSuccess('Settings updated successfully.');
    } catch (error: any) {
      getToasts().addDanger(error?.message || 'Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const bottomBar = hasUnsavedChanges ? (
    <EuiBottomBar data-test-subj='indexerSettings-bottomBar' position='sticky'>
      <EuiFlexGroup
        justifyContent='flexStart'
        alignItems='center'
        responsive={false}
        gutterSize='s'
      >
        <EuiFlexItem grow={false}>
          <p>You have unsaved changes</p>
        </EuiFlexItem>
        <EuiFlexItem />
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            color='ghost'
            size='s'
            iconType='cross'
            onClick={cancelChanges}
          >
            Cancel changes
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            color='secondary'
            fill
            size='s'
            iconType='check'
            onClick={saveChanges}
            isLoading={saving}
            disabled={saving}
          >
            Save changes
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiBottomBar>
  ) : null;

  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        <EuiPanel paddingSize='l'>
          <EuiTitle size='l'>
            <h2>Settings</h2>
          </EuiTitle>

          <EuiSpacer size='m' />

          {loading ? (
            <EuiPanel
              paddingSize='none'
              color='subdued'
              hasBorder={false}
              style={{ boxShadow: 'none' }}
            >
              <EuiLoadingSpinner size='s' />
              <EuiSpacer size='xs' />
              <EuiText color='subdued'>Loading settings...</EuiText>
            </EuiPanel>
          ) : loadError ? (
            <EuiCallOut
              title='Could not load indexer settings'
              color='danger'
              iconType='error'
              data-test-subj='indexerSettings-loadError'
            >
              <p>{loadError}</p>
              <EuiButton
                color='danger'
                fill
                size='s'
                iconType='refresh'
                onClick={fetchSettings}
              >
                Retry
              </EuiButton>
            </EuiCallOut>
          ) : draftSettings ? (
            <EuiPanel paddingSize='none' hasBorder={false} hasShadow={false}>
              <EuiDescribedFormGroup
                fullWidth
                id='indexer-settings-enable-raw-events-group'
                title={<span>Enable raw events</span>}
                description={
                  <div>
                    Enables indexing of raw events into the{' '}
                    <strong>wazuh-events-raw-v5</strong> indices.
                  </div>
                }
                descriptionFlexItemProps={{ style: { alignSelf: 'center' } }}
                fieldFlexItemProps={{ style: { alignSelf: 'center' } }}
              >
                <EngineSwitch
                  field='index_raw_events'
                  ariaLabel='Enable raw events'
                  engine={draftSettings.engine}
                  updateEngine={updateEngine}
                  saving={saving}
                />
              </EuiDescribedFormGroup>
            </EuiPanel>
          ) : null}
        </EuiPanel>
        {bottomBar && bottomBarHost
          ? createPortal(bottomBar, bottomBarHost)
          : null}
      </EuiPageBody>
    </EuiPage>
  );
};
