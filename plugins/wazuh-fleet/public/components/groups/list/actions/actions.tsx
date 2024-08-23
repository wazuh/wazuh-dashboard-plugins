export const tableActions = ({
  setIsFlyoutVisible,
  setGroup,
}: {
  setIsFlyoutVisible: (isVisible: boolean) => void;
  setGroup: (Group: Group) => void;
}) => [
  {
    name: 'View Group details',
    description: 'View Group details',
    icon: 'eye',
    type: 'icon',
    isPrimary: true,
    color: 'primary',
    onClick: (Group: Group) => {
      setGroup(Group);
      setIsFlyoutVisible(true);
    },
  },
  {
    name: 'Edit group',
    description: 'Edit group',
    icon: 'pencil',
    type: 'icon',
    onClick: (Group: Group) => {
      setGroup(Group);
      setIsFlyoutVisible(true);
    },
  },
  {
    name: 'Delete',
    description: 'Delete',
    icon: 'trash',
    type: 'icon',
    onClick: () => {},
  },
];
