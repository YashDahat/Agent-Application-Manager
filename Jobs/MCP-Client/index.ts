import dotenv from "dotenv";
import { Anthropic } from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
    MessageParam,
    Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import readline from "readline/promises";

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if(!ANTHROPIC_API_KEY){
    throw new Error("ANTHROPIC_API_KEY is not set");
}

class MCPClient {
    private mcp: Client;
    private llm: Anthropic;
    private transport: SSEClientTransport | null = null;
    private tools: Tool[] = [];

    constructor() {
        this.llm = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
        this.mcp = new Client({
            name: "mcp-client", version: "1.0.0"
        }, {
            capabilities: {}
        })
    }


    async connectToServer(url : URL){
        this.transport = new SSEClientTransport(url);
        const resp =  await this.mcp.connect(this.transport);
        console.log("Response after connection:", resp);
        const toolsResult = await this.mcp.listTools();
        this.tools = toolsResult.tools.map((tool) => {
            return {
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            };
        });
        console.log(
            "Connected to server with tools:",
            this.tools.map(({ name }) => name)
        );
    }

    async processQuery(query: string) {
        const messages: MessageParam[] = [
            {
                role: "user",
                content: query,
            },
        ];

        const response = await this.llm.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages,
            tools: this.tools,
        });

        const finalText = [];
        const toolResults = [];

        for (const content of response.content) {
            if (content.type === "text") {
                finalText.push(content.text);
            } else if (content.type === "tool_use") {
                const toolName = content.name;
                const toolArgs = content.input as { [x: string]: unknown } | undefined;

                const result = await this.mcp.callTool({
                    name: toolName,
                    arguments: toolArgs,
                });
                toolResults.push(result);
                finalText.push(
                    `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
                );

                messages.push({
                    role: "user",
                    content: result.content as string,
                });

                const response = await this.llm.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 1000,
                    messages,
                });

                finalText.push(
                    response.content[0].type === "text" ? response.content[0].text : ""
                );
            }
        }

        return finalText.join("\n");
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("\nMCP Client Started!");
            console.log("Type your queries or 'quit' to exit.");

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.processQuery(message);
                console.log("\n" + response);
            }
        } finally {
            rl.close();
        }
    }

    async cleanup() {
        await this.mcp.close();
    }

}

async function main() {
    //Connection through SSE
    const client = new MCPClient()
    await client.connectToServer(new URL("http://localhost:3000/sse"));
    await client.chatLoop();
}

main();
