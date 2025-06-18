import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {z} from "zod";
import {getJobsList} from "../services/jobs-service/JobsService.js";
import {
    appendGoogleSheetRows,
    createGoogleDocFromTextAPI,
    createGoogleSheet
} from "../services/google-services/GoogleServices.js";

export class MCPServerHandler {
    private mcpServer: McpServer;

    public constructor() {
        this.mcpServer = new McpServer({
            name: "Job-Server",
            version: "1.0.0",
            capabilities: {
                resources: {},
                tools: {},
            },
        })
        this.addTools();
        this.addPrompts();
    }

    private addTools(): void {
        this.mcpServer.tool(
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
        this.mcpServer.tool(
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
        this.mcpServer.tool(
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

        this.mcpServer.tool(
            'upload-markdown-to-google-doc',
            'Creates a Google Doc with the provided content using the user\'s access token.',
            {
                fileName: z.string().describe('The name of the Google Doc to be created.'),
                fileData: z.string().describe('The markdown or plain text content to be added to the document.'),
                accessToken: z.string().describe('OAuth 2.0 access token with Google Docs API scope.'),
            },
            async ({fileName, fileData, accessToken}) => {
                try {
                    const result = await createGoogleDocFromTextAPI(fileName, fileData, accessToken);

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    docUrl: result.url,
                                    note: 'LLM must return this object exactly as it is, with only the "docUrl" key and mark the response as final using final key, if LLM does not intend to call any further tools',
                                }, null, 2),
                            },
                        ],
                    };
                } catch (err: any) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `❌ Failed to create Google Doc: ${err.message}`,
                            },
                        ],
                        isError: true,
                    };
                }
            }
        );
    }

    private addPrompts(): void {
        this.mcpServer.prompt(
            'create-resume',
            'This prompt will be used to create a tailored resume based on the job details provided. Upload this resume to Google Docs and send the URL.',
            {
                ReferenceResume: z.string().describe('Base64 or URL of the reference resume file uploaded by the user'),
                JobDetails: z.string().describe('JSON stringified job details for resume tailoring'),
            },
            async ({ ReferenceResume, JobDetails }) => {

                return {
                    description: 'Prompt to generate tailored resume and upload it.',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: `
                        You are a helpful AI assistant.
                        
                        Here is a reference resume (in base64 or a downloadable URL) and the job details. Please:
                        1. Tailor the resume for the job.
                            a. Extract all relevant skills, experiences, education, projects and co-curricular activities from the resume according to job description.
                            b. Extract all keywords from the job description.
                            c. Fit the keywords into experiences, projects and co-curricular activities.
                            d. Create a final resume based on this.s 
                        2. Save it as a PDF.
                        3. Use the "uploadToGoogleDocs" tool to upload the file.
                        4. Share the Google Docs URL in your response.
                        5. If tool is not present directly respond with the doc.
                        
                        ### Reference Resume (Base64 or URL):
                        ${ReferenceResume}
                        
                        ### Job Details:
                        ${JobDetails}
                        
                        Please respond only with the tailored resume in markdown string and then use the tool to upload it on google drive.
                        Respond the resume data in the tool call no need to create a separate text message for this.
                        If tool is not present return the markdown string as it is.
                        `.trim(),
                            },
                        },
                    ],
                };
            }
        );
        this.mcpServer.prompt(
            'create-referral-message',
            'Generates a personalized referral message tailored to a job, using the user’s resume.',
            {
                ReferenceResume: z.string().describe('Base64 or URL of the reference resume file uploaded by the user'),
                JobDetails: z.string().describe('JSON stringified job details for resume tailoring'),
            },
            async ({ ReferenceResume, JobDetails }) => {
                return {
                    description: 'Prompt to generate tailored referral message for job',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: `
                                You are a helpful AI assistant tasked with writing personalized referral messages for job applications.
                                
                                ### Objective:
                                Craft a concise, friendly, and tailored message that a job seeker can send to a potential referrer.
                                
                                ### Guidelines:
                                1. Start the message with "Hi" and end it with "Thanks and regards".
                                2. Highlight key skills and experiences (if you find any, we want to keep message short and simple) from the resume that align with the job.
                                3. Keep the tone professional and easy to read in one go. Keep the message short.
                                4. Include job url in this message. Include space to add resume link (Compulsory).
                                5. Add a warning for the user if the job description does not match with the resume before you create the actual message. 
                                6. In the message don't mention anything regarding mismatch.
                                
                                
                                ## Reference resume: ${ReferenceResume}
                                ## Job details: ${JobDetails}
                                
                                Return only a JSON object in the following format:
                                
                                {
                                  "final": true,
                                  "message": "Your generated referral message here"
                                }
                                
                                Do not include explanations, markdown formatting, or any other text outside the JSON object.
                                Create a single json object and check if the formatted message is a valid json string.
                                `.trim()
                            }
                        }
                    ]
                };
            }
        );
    }

    public getMcpServer(): McpServer {
        return this.mcpServer;
    }
}