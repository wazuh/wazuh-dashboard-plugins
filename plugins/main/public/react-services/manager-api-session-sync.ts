import { GenericRequest } from './generic-request';
import { ApiCheck } from './wz-api-check';
import { AppState } from './app-state';
import { WzAuthentication } from './wz-authentication';
import { updateIsCCS } from '../redux/actions/appStateActions';
import store from '../redux/store';

let ccsStatusFetchedThisPageSession = false;

/**
 * Application guard runs again on every Wazuh app mount (sidebar switches).
 * Hit /hosts/ccs/status only once per browser page load; Redux keeps isCCS until reload.
 */
export async function fetchCcsStatusForApplicationMount(): Promise<void> {
  if (ccsStatusFetchedThisPageSession) {
    return;
  }
  try {
    const response = await GenericRequest.request(
      'GET',
      '/hosts/ccs/status',
      {},
    );
    store.dispatch(updateIsCCS(response?.data?.isCCS ?? false));
    ccsStatusFetchedThisPageSession = true;
  } catch {}
}

export async function fetchManagerApiHostsList(): Promise<any[]> {
  const response = await GenericRequest.request('GET', '/hosts/apis', {});
  return response?.data ?? [];
}

export async function syncSessionToPrimaryWhenMismatch(options?: {
  isCancelled?: () => boolean;
}): Promise<void> {
  const isCancelled = options?.isCancelled;

  const hosts = await fetchManagerApiHostsList();
  if (isCancelled?.() || !hosts?.length) return;

  const firstHost = hosts[0];
  let currentId: string | null = null;

  try {
    const raw = AppState.getCurrentAPI();
    currentId = raw ? JSON.parse(raw)?.id : null;
  } catch {}

  if (currentId === firstHost.id) return;

  const response = await ApiCheck.checkApi(firstHost, true);
  if (isCancelled?.()) return;

  const { allow_run_as, verify_ca, ...cluster_info } = response.data || {};

  AppState.setClusterInfo(cluster_info);
  AppState.setCurrentAPI(
    JSON.stringify({
      name: cluster_info.cluster,
      id: firstHost.id,
    }),
  );
  if (isCancelled?.()) return;
  await WzAuthentication.refresh(true);
}
