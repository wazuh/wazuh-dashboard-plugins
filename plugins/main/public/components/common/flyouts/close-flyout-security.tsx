export const closeFlyout = async (needRefresh, setState, getData) => {
  setState(false);
  needRefresh && (await getData());
};
