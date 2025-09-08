import { useSelector } from "react-redux";
import type { AppStoreState } from "../store";

export const showMenu = useSelector(
  (state: AppStoreState) => state?.appStateReducers?.showMenu,
);
