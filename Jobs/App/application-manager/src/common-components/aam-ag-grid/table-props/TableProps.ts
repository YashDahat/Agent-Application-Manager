export interface IColumnProps{
    key: string;
    label: string;
    selectedCellEventHandler?: (data: unknown)=>void;
}
export interface IItemProps{
    id?: number;
    [key: string]: unknown;
}
export interface ITableProps{
    columns: IColumnProps[];
    items: IItemProps[];
}