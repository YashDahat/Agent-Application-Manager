import {ColumnTypes} from "@/common-components/aam-ag-grid/formatter/Formatter.ts";

export interface IColumnProps{
    key: string;
    label: string;
    selectedCellEventHandler?: (data: unknown)=>void;
    columnType?: ColumnTypes;
}
export interface IItemProps{
    id?: number;
    [key: string]: unknown;
}
export interface ITableProps{
    columns: IColumnProps[];
    items: IItemProps[];
}