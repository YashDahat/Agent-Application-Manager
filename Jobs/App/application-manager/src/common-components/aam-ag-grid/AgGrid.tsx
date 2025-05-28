import {ITableProps} from "@/common-components/aam-ag-grid/table-props/TableProps.ts";
import {useMemo, useState} from "react";
import {columnTypes} from "@/common-components/aam-ag-grid/formatter/Formatter.ts";
import {Label} from "@radix-ui/react-label";
import {ColDef, ICellRendererParams, ModuleRegistry} from "@ag-grid-community/core";
import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model"
import {themeQuartz} from "@ag-grid-community/theming";
import {AgGridReact} from "@ag-grid-community/react";
import {Button} from "@/components/ui/button.tsx";


ModuleRegistry.registerModules([ClientSideRowModelModule]);

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
    const [columns, setColumns] = useState<ColDef[]>([]);
    useMemo(()=>{
        const updatedColumns = tableProps.columns.map(column => ({
            field: column.key,
            headerName: column.label,
            flex: 1,
            cellRenderer: column.selectedCellEventHandler ? (params: ICellRendererParams) => {
                console.log('Params value:', params.value);
                return (params.value != undefined) ? <Button variant={'link'} onClick={() => {
                    column.selectedCellEventHandler!(params.data);
                }} className={'text-blue-600 hover:underline cursor-pointer underline-offset-4'}>{column.label}
                </Button> : <Label>No data available</Label>
            } : undefined,
            type: column.columnType ?? 'text'
        })) as ColDef[];
        if(tableProps.isActionsEnabled){
            const actionsColumn = {
                headerName: 'Actions',
                flex: 1,
                cellRenderer: (params: ICellRendererParams) => {
                    return <div className={'flex flex-row gap-1'}>
                        {
                            tableProps.actions?.map(action => {
                                return <Button
                                    variant={action.design}
                                    className="hover:underline cursor-pointer underline-offset-4 text-purple-600"
                                    onClick={() => action.actionEventHandler(params.data)}
                                >
                                    {action.icon}
                                    {action.name}
                                </Button>

                            })
                        }
                    </div>
                }
            }
            updatedColumns.push(actionsColumn as ColDef);
        }
        setColumns(updatedColumns);
    }, [tableProps.columns, tableProps.items]);

    return (
        <div style={{height: 830}}>
            <AgGridReact
                theme={darkTheme}
                rowData={tableProps.items}
                columnDefs={columns}
                pagination={true}
                columnTypes={columnTypes}
            />
        </div>
    )
}