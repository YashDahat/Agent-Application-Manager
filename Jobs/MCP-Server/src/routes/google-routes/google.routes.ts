import {Router} from 'express';
import dotenv from "dotenv";
import {google} from "googleapis";
import {
    appendGoogleSheetRows,
    createGoogleDocFromTextAPI,
    createGoogleSheet
} from "../../services/google-services/GoogleServices.js";

const router = Router();

dotenv.config();

const scopes = [
'https://www.googleapis.com/auth/spreadsheets',
'https://www.googleapis.com/auth/drive.file',
'https://www.googleapis.com/auth/documents'
];


const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
)

router.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    res.redirect(authUrl);
});

router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code as string;
    console.log('Codes:', code);
    const {tokens} = await oauth2Client.getToken(code);
    console.log("Tokens:", tokens);
    res.redirect(process.env.CLIENT_URL + '/workspace?access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token);
});

router.post('/append-spreadsheet-data', async (req, res) => {
    const {spreadsheetUrl, rows} = req.body;
    console.log('SpreadSheetURL :', spreadsheetUrl, ', rows:', rows);
    const accessToken = req.headers.authorization;

    if (!accessToken) {
        res.status(401).json({error: 'Unauthorized: Missing or invalid access token'});
    }

    if (!spreadsheetUrl) {
        res.status(400).json({error: 'Bad Request: Spreadsheet URL is required'});
    }

    if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({error: 'Bad Request: Rows to append are required and must be a non-empty array'});
    }

    try {
        const appendResult = await appendGoogleSheetRows(spreadsheetUrl, accessToken!, rows);

        if (appendResult) {
            res.status(200).json({message: 'Data appended successfully', data: appendResult});
        } else {
            res.status(500).json({error: 'Internal Server Error: Failed to append data to the spreadsheet'});
        }
    } catch (error: any) {
        console.error('Error appending data:', error);
        res.status(500).json({error: `Internal Server Error: ${error.message || 'An unexpected error occurred'}`});
    }
});

router.post("/create-sheet", async (req, res) => {
    try {
        const accessToken = req.headers.authorization;
        console.log('Bearer:', accessToken);
        if (accessToken) {
            const response = await createGoogleSheet('Jobs_Listing_sheet', accessToken);
            res.status(200).json(response)
        } else {
            res.status(401).send('Unauthorized access.')
        }
    } catch (err) {
        console.error('Error creating sheet:', err);
        res.status(500).send('Error while creating Sheets.');
    }
});

/**
 * API endpoint to read the content of a Google Drive document by its URL using direct fetch.
 */
router.post('/drive/read-doc-url-direct', async (req, res) => {
    const {docUrl} = req.body;
    const accessToken = req.headers.authorization;

    if (!accessToken) {
        res.status(401).json({error: 'Unauthorized: Missing access token'});
    }

    if (!docUrl) {
        res.status(400).json({error: 'Bad Request: Google Drive document URL is required'});
    }

    try {
        const fileIdMatch = docUrl.match(/d\/([a-zA-Z0-9-_]+)/);
        if (!fileIdMatch || !fileIdMatch[1]) {
            res.status(400).json({error: 'Bad Request: Invalid Google Drive document URL format'});
        }
        const fileId = fileIdMatch[1];
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/download`;

        const response = await fetch(exportUrl, {
            method: 'POST',
            headers: {
                'Authorization': `${accessToken}`,
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            const text = await response.text();
            res.status(200).send(text);
        } else {
            const errorData = await response.json();
            console.error('Error reading document:', response.status, response.statusText, errorData);
            res.status(response.status).json({
                error: `Failed to read document: ${response.statusText}`,
                details: errorData
            });
        }
    } catch (error: any) {
        console.error('Error reading document:', error);
        res.status(500).json({error: `Failed to read document: ${error.message}`});
    }
});

router.post('/upload-markdown', async (req, res) => {
    try {
        const { fileName, text } = req.body;
        const accessToken = req.headers.authorization;

        if (!fileName || !text || !accessToken) {
            res.status(400).json({ error: 'fileName, text, and accessToken are required' });
            return;
        }

        const result = await createGoogleDocFromTextAPI(fileName, text, accessToken);
        res.status(200).json({ message: 'Document created successfully', ...result });
    } catch (err: any) {
        console.error('Error creating Google Doc:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;