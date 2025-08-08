export const mapToOptions = (items: any[], map: (item: any) => any) => {
  if (!Array.isArray(items)) {
    throw new Error('Expected items to be an array');
  }
  if (typeof map !== 'function') {
    throw new Error('Expected map to be a function');
  }
  const isEmpty = !items || items.length === 0;
  if (isEmpty) {
    return [];
  }
  return items.map(item => {
    const mappedItem = map(item);
    return {
      value: mappedItem,
      text: mappedItem,
    };
  });
};
