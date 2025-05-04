import {Anthropic, Message} from "@anthropic-ai/sdk";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {WebSocketClientTransport} from "@modelcontextprotocol/sdk/client/websocket.js"
import {MessageCreateParamsBase, MessageParam, Tool,} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import {IMessage} from "@/feature/workspace-page/WorkspacePage.tsx";
import {getItem} from "@/utils/localStorage.ts";


const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
}


export class MCPClient {
    private mcp: Client;
    private llm: Anthropic;
    private transport: WebSocketClientTransport | null = null;
    public tools: Tool[] = [];
    private accessToken : string | null = null;

    constructor() {
        this.llm = new Anthropic({apiKey: ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true});
        this.mcp = new Client({ name: "mcp-client", version: "1.0.0" }, { capabilities: {} });
        this.accessToken = getItem('access_token');
        console.log('Access Token received:', this.accessToken);
    }

    public async connectToServer(url: string) {
        console.log('URL we received for Server:', url);
        this.transport = new WebSocketClientTransport(new URL(url));

        try {
            // Await the connection before calling anything else
            const connectResponse = await this.mcp.connect(this.transport);
            console.log('Connected to server:', connectResponse);

            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map(tool => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                };
            });
            console.log('Result for Tools:', this.tools);
        } catch (error) {
            console.error('Error while connecting or fetching tools:', error);
        }
    }

    async processQuery(query: string, setMessages: (message: IMessage)=>void): Promise<void> {
        const messages: MessageParam[] = [
            {
                role: 'user',
                content: query
            }
        ];

        console.log('Messages:', messages);
        const body:{ max_tokens: number; messages: MessageParam[]; model: string; tools: Tool[] }  = {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages,
            tools: this.tools
        }
        console.log('Body we got for request:', body);
        const response = await this.llm.messages.create(body);
        await this.recursiveToolCall(response, [], setMessages);
    }

    async cleanup() {
        await this.mcp.close();
    }

    async recursiveToolCall( message: any, messages: MessageParam[], setMessages: (message: IMessage)=>void ): Promise<void>{
        for(let content of message.content){
            if(content.type == 'text'){
                //Push message to the message list
                const message = {
                    variant: 'received',
                    fallBack: 'AI',
                    message: content.text,
                    isLoading: false
                }
                setMessages(message as IMessage)
            }else if('tool_use'){
                const toolName = content.name;
                let toolArgs = content.input as { [x: string]: unknown } | undefined;
                if (toolArgs && 'accessToken' in toolArgs) {
                    toolArgs['accessToken'] = this.accessToken;
                    console.log("Access Token:", toolArgs['accessToken']);
                } else {
                    console.log("accessToken is missing in toolArgs");
                    toolArgs = {...toolArgs, 'accessToken': this.accessToken};
                }
                console.log('Tool call received from the LLM: toolname:', toolName, ', toolArgs:', toolArgs)

                if(toolArgs){
                    //Push the message to the message list -> Making call to the particular tool
                    const message = {
                        variant: 'received',
                        fallBack: 'AI',
                        message: `[Calling tool ${toolName} ]`,
                        isLoading: false
                    }
                    setMessages(message as IMessage)
                    // After receiving the tool response -> Push the message to the message list
                    const toolsResponse = await this.mcp.callTool({
                        name: toolName,
                        arguments: toolArgs
                    });
                    console.log('Tools response:', toolsResponse);
                    // Creating message array
                    messages.push({
                        role: 'user',
                        content: JSON.stringify(toolsResponse)
                    })
                    // Creating the body for the message
                    const body: MessageCreateParamsBase = {
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 1000,
                        messages,
                        tools: this.tools
                    }
                    const llmResponse = await this.llm.messages.create(body);
                    await this.recursiveToolCall(llmResponse, messages, setMessages);
                }
            }
        }
    }
}