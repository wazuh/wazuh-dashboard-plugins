export type tDataSource = {
    id: string;
    title: string;
    select(): Promise<void>;
}