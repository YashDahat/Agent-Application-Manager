//Create Google Sheet
export async function
createGoogleSheet(title: string, accessToken: string): Promise<any | null> {
    const apiUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.trim()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    title: title,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error creating spreadsheet:', error);
            return null;
        }

        // const data = await response.json();
        console.log('Spreadsheet created successfully:', response);
        return response; // The response will contain information about the new spreadsheet, including its ID.
    } catch (error) {
        console.error('There was an error creating the spreadsheet:', error);
        return null;
    }
}

interface ValueInputOption {
    USER_ENTERED: string;
    RAW: string;
}

interface InsertDataOption {
    OVERWRITE: string;
    INSERT_ROWS: string;
}

//Adding Data to the sheet
export async function appendGoogleSheetRows(
    spreadsheetUrl: string,
    accessToken: string,
    values: any[][], // Array of rows, where each row is an array of cell values
    valueInputOption: keyof ValueInputOption = 'USER_ENTERED',
    insertDataOption: keyof InsertDataOption = 'INSERT_ROWS'
): Promise<any | null> {
    try {
        // Extract the spreadsheet ID from the URL
        // const spreadsheetIdMatch = spreadsheetUrl.match(/d\/([a-zA-Z0-9-_]+)/);
        // if (!spreadsheetIdMatch || !spreadsheetIdMatch[1]) {
        //     console.error('Invalid Google Sheets URL provided.');
        //     return null;
        // }
        const parts = spreadsheetUrl.split('/');
        const spreadsheetId = parts[parts.indexOf('d') + 1];
        console.log('Spreadsheet id:', spreadsheetId);
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1?valueInputOption=${valueInputOption}`;
        const body = JSON.stringify({
            values: values,
        });
        console.log('API URL:', apiUrl);
        console.log('Body:', body);
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: body,
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error appending rows to spreadsheet:', error);
            return null;
        }

        const data = await response.json();
        console.log('Rows appended successfully:', data);
        return data;
    } catch (error) {
        console.error('There was an error appending rows to the spreadsheet:', error);
        return null;
    }
}