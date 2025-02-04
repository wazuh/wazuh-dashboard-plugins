import { first } from 'rxjs/operators';
import { CoreStart } from '../../../../src/core/public';

export async function getCurrentNavGroup(core: CoreStart) {
  return core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();
}
