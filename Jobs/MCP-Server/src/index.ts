import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import {z} from "zod";
import express from "express";
import {getJobDetails, getJobsList, getJobsListV2} from "./jobs-service/JobsService.js";
import {appendGoogleSheetRows, createGoogleSheet,} from "./google-services/GoogleServices.js";
import dotenv from 'dotenv';
import {google} from "googleapis";
import cors from 'cors';
import * as http from "http";
import {WebSocketServer, WebSocket} from "ws";
import {WebsocketTransport} from "./transport/Websocket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
app.use(express.json());
app.use(cors({origin: 'http://localhost:5173'}));
let transport: SSEServerTransport | null = null;
let websocketTransport: WebsocketTransport | null = null;

const mcpServer = new McpServer({
    name: "Job-Server",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

const oauth2Client = new google.auth.OAuth2(
    '1065879422486-46ismsi231snm30vddvuhj5816lugeed.apps.googleusercontent.com',
    "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",
    "http://localhost:3000/oauth2callback"
)

//Tools Listing
//Get jobs for the query
mcpServer.tool(
    "search-and-store-job-listings",
    `Search recent job listings based on a role, location, and date posted.
This tool will create a new Google Spreadsheet, append the job data, and return both job listings and the spreadsheet link.`,
    {
        role: z.string().describe("The job title to search for, e.g., 'Frontend Developer'"),
        location: z.string().describe("The location to search in, e.g., 'New York'"),
        date_posted: z.enum(["past month", "past week", "24hrs"]).describe(
            "The recency of job postings. Must be one of: past month, past week, 24hrs."
        ),
        accessToken: z.string().describe("Google OAuth2 token to authorize Sheets access"),
    },
    async ({role, location, date_posted, accessToken}) => {
        try {
            const jobs = await getJobsList(role, location, date_posted);

            if (!jobs || jobs.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ No jobs found for role "${role}" in location "${location}" for "${date_posted}".`,
                        },
                    ],
                };
            }

            // 1. Create Spreadsheet
            const sheetName = `Jobs_${role}_${location}_${Date.now()}`;
            const sheetResponse = await createGoogleSheet(sheetName, accessToken);
            const sheet = await sheetResponse.json();
            const spreadsheetUrl = sheet.spreadsheetUrl;
            console.log('Spreadsheet URL received:', sheet);
            // 2. Format jobs into rows
            const values = [
                ["Job Title", "Company", "Description", "URL", "Skills"],
                ...jobs.map(job => [
                    job.jobTitle,
                    job.companyName,
                    job.jobDescription || "-",
                    job.jobUrl,
                    "-"
                ])
            ];

            // 3. Append to sheet
            await appendGoogleSheetRows(spreadsheetUrl, accessToken, values);

            // 4. Return jobs + sheet link
            return {
                content: [
                    {
                        type: "text",
                        text: `✅ Found ${jobs.length} job(s) for "${role}" in "${location}".\n\nHere are the jobs:\n\n${JSON.stringify(jobs, null, 2)}\n\n📄 Spreadsheet with the job listings: ${spreadsheetUrl}. Display spreadsheet url in final message.`,
                    },
                ],
            };
        } catch (error) {
            console.error("Job search + sheet write error:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error occurred while processing your job search and saving to spreadsheet.`,
                    },
                ],
            };
        }
    }
);


//Create Spreadsheet on google sheets
mcpServer.tool(
    "create-job-spreadsheet",
    `Create a new Google Spreadsheet to store job listings. This spreadsheet will be named accordingly and accessible via the user's Google account.`,
    {
        sheetName: z.string().describe("The desired name of the spreadsheet, e.g., 'Jobs_Listing_sheet'"),
        accessToken: z.string().optional().describe("Google OAuth2 access token to authorize the request"),
    },
    async ({sheetName, accessToken}) => {
        if (!accessToken) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ Access token not provided. Please authenticate before creating a spreadsheet.",
                    },
                ],
            };
        }

        try {
            console.log('Sheet name:', sheetName, ', access token:', accessToken);
            const response = await createGoogleSheet(sheetName, accessToken);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create sheet: ${errorText}`);
            }

            const data = await response.json();
            return {
                content: [
                    {
                        type: "text",
                        text: `Spreadsheet "${sheetName}" created successfully!\n\nSheet ID: ${data.spreadsheetId} display this message on the screen`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error creating spreadsheet: ${(error as Error).message}`,
                    },
                ],
            };
        }
    }
);

//Tool for appending data into spreadsheet
mcpServer.tool(
    "append-job-data-to-spreadsheet",
    `Append job-related rows of data to an existing Google Spreadsheet.

The spreadsheet should be publicly accessible to the authorized user. Each row will be added to 'Sheet1' of the provided spreadsheet URL.

Data should be appended in the order and format expected by the sheet (e.g., Job Title, Company Name, Job URL, etc.).`,
    {
        spreadsheetUrl: z.string().url().describe("The full URL of the Google Sheet where data should be appended"),
        accessToken: z.string().describe("OAuth 2.0 token to authenticate the user with Google Sheets API"),
        rows: z.array(z.array(z.string())).describe("Array of rows to append; each row is an array of strings representing cell values"),
    },
    async ({spreadsheetUrl, accessToken, rows}) => {
        const result = await appendGoogleSheetRows(
            spreadsheetUrl,
            accessToken,
            rows,
            'USER_ENTERED',
            'INSERT_ROWS'
        );

        if (!result) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ Failed to append data to the spreadsheet. Please verify the spreadsheet URL and access token.",
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: `✅ Successfully appended ${rows.length} row(s) to the spreadsheet.`,
                },
            ],
        };
    }
);


//Start express server
app.get("/sse", async (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    mcpServer.connect(transport);
})

app.post("/messages", (req, res) => {
    console.log('Messages was called here are the transport details')
    if (transport) {
        console.log('Transport is not undefined.')
        transport.handlePostMessage(req, res);
    }
});

app.post("/get_jobs", async (req, res) => {
    try {
        const { role, location, date_posted } = req.body;
        if (!role || !location || !date_posted) {
            res.status(400).json({ error: "Missing role, location, or date_posted in request body." });
        }else{
            console.log('Role:', role, ', Location:', location, ', Date posted:', date_posted);
            const response = await getJobsListV2(role, location, date_posted);
            res.status(200).json(response);
        }
    } catch (error) {
        console.error("Error fetching job listings:", error);
        res.status(500).json({ error: "Failed to fetch job listings." });
    }
});

app.get("/get_job_details", async (req, res) => {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
        res.status(400).json({ error: "Missing or invalid 'jobId' parameter" });
    }else{
        try {
            const jobDetails = await getJobDetails(jobId);
            res.status(200).json(jobDetails);
        } catch (error) {
            console.error("Error fetching job details:", error);
            res.status(500).json({ error: "Failed to fetch job details" });
        }
    }
});
//Google auth server

// Step 1: Send user to Google for consent
app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
        ],
    });
    res.redirect(authUrl);
});

// Step 2: Handle OAuth2 callback and store token
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code as string;
    const {tokens} = await oauth2Client.getToken(code);
    console.log("Tokens:", tokens);
    res.redirect('http://localhost:5173/workspace?access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token);
});


app.post('/append-spreadsheet-data', async (req, res) => {
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

app.post("/create-sheet", async (req, res) => {
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
app.post('/drive/read-doc-url-direct', async (req, res) => {
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

//Websocket connection
wss.on('connection', (ws: WebSocket, request: Request) => {
    console.log('Client is connected to server!');
    console.log('Request received from the server:', request);
    websocketTransport = new WebsocketTransport(ws);
    mcpServer.connect(websocketTransport);
})


server.listen(3000, () => {
    console.log('Server listening on localhost: 3000');
});