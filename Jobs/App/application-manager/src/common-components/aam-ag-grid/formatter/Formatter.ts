import {ColDef, ICellRendererParams} from "@ag-grid-community/core";
import {data} from "react-router-dom";

export enum ColumnTypes {
    NODATA= "NODATA"
}

export const columnTypes : {[key: string]: ColDef} = {
    [ColumnTypes.NODATA] : {
        valueFormatter: (data)=>{
            console.log('Value:', data.value);
            return (data.value == undefined || data.value == '')? 'No data available': data.value;
        }
    }
}