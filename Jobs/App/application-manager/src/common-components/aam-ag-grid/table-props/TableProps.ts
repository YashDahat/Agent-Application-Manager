import {ColumnTypes} from "@/common-components/aam-ag-grid/formatter/Formatter.ts";
export interface IActionProps{
    name: string;
    icon: any;
    actionEventHandler: (data: unknown)=>void;
    isDisabled?: boolean;
    design?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined
}
export interface IColumnProps{
    key: string;
    label: string;
    selectedCellEventHandler?: (data: unknown)=>void;
    columnType?: ColumnTypes;
}
export interface IItemProps{
    [key: string]: any;
}
export interface ITableProps{
    columns: IColumnProps[];
    items: IItemProps[];
    isActionsEnabled?: boolean;
    actions?: IActionProps[];
}