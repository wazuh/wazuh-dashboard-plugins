import { useEffect, useState, useRef, useCallback } from 'react';
import { getChrome } from '../plugin-services';

export const useDockedSideNav = () => {
  const [sideNavDocked, _setSideNavDocked] = useState<boolean>(false);
  const [isDockedSideNavVisible, setIsDockedSideNavVisible] =
    useState<boolean>(false);

  /*
     We have to create a reference to the state of the react component,
     because the event handler cannot read the latest state otherwise
  */
  const setSideNavDocked = (value: boolean) => {
    currentSideNavDocked.current = value;
    _setSideNavDocked(value);
  };

  // Create references so the event handler can read the latest values
  let timeoutID = useRef(0);
  const currentSideNavDocked = useRef(sideNavDocked);

  // If the inner width of the window is less than 992px, the side nav is always hidden.
  // The use of useCallback is to keep the function reference the same so we can remove it in the event listener
  const onWindowResize = useCallback(() => {
    // Clear the timeout so we don't call the function multiple times while the window is being resized
    clearTimeout(timeoutID.current);
    timeoutID.current = setTimeout(() => {
      setIsDockedSideNavVisible(
        currentSideNavDocked.current && window.innerWidth > 991,
      );
    }, 100);
  }, []);

  useEffect(() => {
    onWindowResize();
  }, [sideNavDocked]);

  useEffect(() => {
    const isNavDrawerSubscription = getChrome()
      .getIsNavDrawerLocked$()
      .subscribe((value: boolean) => {
        setSideNavDocked(value);
      });

    window.addEventListener('resize', onWindowResize, true);
    return () => {
      isNavDrawerSubscription.unsubscribe();
      window.removeEventListener('resize', onWindowResize, true);
    };
  }, []);

  return isDockedSideNavVisible;
};

export type UseDockedSideNav = () => boolean;
