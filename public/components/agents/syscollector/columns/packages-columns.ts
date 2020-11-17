const windowsColumns = [
  { id: 'name' },
  { id: 'architecture', width: "10%" },
  { id: 'version' },
  { id: 'vendor', width: '30%' }
];
const linuxColumns = [
  { id: 'name' },
  { id: 'architecture', width: '10%' },
  { id: 'version' },
  { id: 'vendor', width: "30%" },
  { id: 'description', width: '30%' }
];
const MacColumns = [
  { id: 'name' },
  { id: 'version' },
  { id: 'format' },
  { id: 'location', width: "30%" },
  { id: 'description', width: '20%' }
];

export const packagesColumns = {
  'windows': windowsColumns,
  'linux': linuxColumns,
  'apple': MacColumns
}
