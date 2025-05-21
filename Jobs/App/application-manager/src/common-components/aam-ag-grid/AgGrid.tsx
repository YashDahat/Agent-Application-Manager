import {AllCommunityModule, ModuleRegistry, themeQuartz} from 'ag-grid-community';
import {ColDef, ICellRendererParams,} from '@ag-grid-community/core';
import {ITableProps} from "@/common-components/aam-ag-grid/table-props/TableProps.ts";
import {useMemo} from "react";
import {AgGridReact} from "ag-grid-react";
import {columnTypes} from "@/common-components/aam-ag-grid/formatter/Formatter.ts";
import {Label} from "@radix-ui/react-label";

ModuleRegistry.registerModules([AllCommunityModule]);

// to use myTheme in an application, pass it to the theme grid option
const darkTheme = themeQuartz
.withParams({
    backgroundColor: "#1f2836",
    browserColorScheme: "dark",
    chromeBackgroundColor: {
        ref: "foregroundColor",
        mix: 0.07,
        onto: "backgroundColor"
    },
    foregroundColor: "#FFF",
    headerFontSize: 14,
    columnBorder: false,
    wrapperBorder: false,
    headerRowBorder: true,
    footerRowBorder: true,
});


export const AgGrid = (tableProps: ITableProps) => {
    const colDefs: ColDef[] = useMemo(()=>{
        let columns: ColDef[] = tableProps.columns.map(column =>({
            field: column.key,
            headerName: column.label,
            flex: 1,
            cellRenderer: column.selectedCellEventHandler ? (params: ICellRendererParams)=> {
                return (params.value != undefined || params.value != '') ? <button onClick={() => {
                    column.selectedCellEventHandler!(params.value);
                }} className={'text-blue-600 hover:underline cursor-pointer underline-offset-4'}>
                    {column.label}
                </button>: <Label>No data available</Label>
            } : undefined,
            type: column.columnType ?? 'text'
        }))
        return columns;
    }, [tableProps.columns, tableProps.items]);

    return (
        <div style={{height: 830}}>
            <AgGridReact
                theme={darkTheme}
                rowData={tableProps.items}
                columnDefs={colDefs}
                pagination={true}
                columnTypes={columnTypes}
            />
        </div>
    )
}