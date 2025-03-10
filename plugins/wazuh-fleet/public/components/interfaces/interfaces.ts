export interface ViewInterface {
  name: string;
  id: string;
  path: string;
  renderOnMenu: boolean;
  renderMenu: boolean;
  render: (props: Record<string, any>) => React.ReactNode;
  breadcrumb: (
    id?: string,
  ) => { text: string | React.ReactNode; className?: string }[];
}
