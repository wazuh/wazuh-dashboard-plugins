import { useEffect, useState } from 'react';
import { getChrome } from '../../../kibana-services';

export const useDockedSideNav = () => {
    const [sideNavDocked, setSideNavDocked] = useState<boolean>(false);

    useEffect(() => {
        const isNavDrawerSubscription = getChrome()
            .getIsNavDrawerLocked$()
            .subscribe((value: boolean) => {
                setSideNavDocked(value);
            });

        return () => {
            isNavDrawerSubscription.unsubscribe();
        };
    }, []);

    return sideNavDocked;
};
