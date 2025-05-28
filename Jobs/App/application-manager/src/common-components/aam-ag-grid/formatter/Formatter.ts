import {ColTypeDef} from "@ag-grid-community/core";


export enum ColumnTypes {
    NODATA= "NODATA"
}

export const columnTypes : {[key: string]: ColTypeDef} = {
    [ColumnTypes.NODATA] : {
        valueFormatter: (data)=>{
            console.log('Value:', data.value);
            return (data.value == undefined || data.value == '')? 'No data available': data.value;
        }
    }
}