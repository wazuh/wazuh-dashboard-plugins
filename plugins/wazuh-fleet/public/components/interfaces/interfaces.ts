export interface ViewInterface {
  name: string;
  id: string;
  path: string;
  renderOnMenu: boolean;
  renderMenu: boolean;
  render: (props: any) => React.ReactNode;
  breadcrumb: (
    name?: string,
  ) => { text: string | React.ReactNode; className?: string }[];
}
