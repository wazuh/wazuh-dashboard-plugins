import { BehaviorSubject } from 'rxjs';

// True while the CTI upsell bar holds the bottom bar slot; the updates bar waits for it.
export const ctiUpsellBarVisible$ = new BehaviorSubject<boolean>(false);
