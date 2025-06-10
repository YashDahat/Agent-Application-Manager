import {Anthropic} from "@anthropic-ai/sdk";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {MessageCreateParamsBase, MessageParam, Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import {getItem} from "@/utils/localStorage.ts";
import {WebSocketClientTransport} from "@/transport/WebSocketClientTransport.ts";


const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
}


export class MCPClient {
    private mcp: Client;
    private llm: Anthropic;
    private transport: WebSocketClientTransport | null = null;
    public tools: Tool[] = [];
    private prompts: any[] = []
    private accessToken : string | null = null;


    constructor() {
        this.llm = new Anthropic({apiKey: ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true});
        this.mcp = new Client({ name: "mcp-client", version: "1.0.0" }, { capabilities: {} });
        this.accessToken = getItem('access_token');
    }

    public async connectToServer(url: string) {
        this.transport = new WebSocketClientTransport(new URL(url), this.onCloseForConnection);
        await this.connect();
    }

    private async connect(){
        if(this.transport){
            try {
                // Await the connection before calling anything else
                await this.mcp.connect(this.transport);
                const toolsResult = await this.mcp.listTools();
                this.tools = toolsResult.tools.map(tool => {
                    return {
                        name: tool.name,
                        description: tool.description,
                        input_schema: tool.inputSchema,
                    };
                });
                console.log('Result for Tools:', this.tools);
                this.prompts = Object.values(await this.mcp.listPrompts());
                console.log('Result for prompts:', this.prompts);
            } catch (error) {
                console.error('Error while connecting or fetching tools:', error);
            }
        }else{
            console.error('Error while connection, transport is not setup');
        }
    }

    private isValidJson(str: string): boolean {
        try {
            const parsed = JSON.parse(str);
            return typeof parsed === 'object' && parsed !== null;
        } catch (e) {
            return false;
        }
    }

    async processQuery(query: string): Promise<any> {
        const messages: MessageParam[] = [
            {
                role: 'user',
                content: query
            }
        ];

        console.log('Messages:', messages);
        const body:{ max_tokens: number; messages: MessageParam[]; model: string; tools: Tool[];}  = {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages,
            tools: this.tools
        }
        console.log('Body we got for request:', body);
        const response = await this.llm.messages.create(body);
        return await this.recursiveToolCall(response, messages);
    }

    async cleanup() {
        console.log('Called for closing connections!');
        await this.mcp.close();
    }

    async recursiveToolCall( message: any, messages: MessageParam[]): Promise<any>{
        for(let content of message.content){
            if(content.type == 'text'){
                //Push message to the message list
                console.log('Message from the LLM:', message);
                messages.push({
                    role: 'assistant',
                    content: JSON.stringify(message)
                })
                if(this.isValidJson(content.text)){
                    console.log('It is a valid json.')
                    const jsonMessage: {[key: string]: unknown} = JSON.parse(content.text);
                    if(jsonMessage.final){
                        return jsonMessage;
                    }
                }
            }else if(content.type == 'tool_use'){
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
                    return await this.recursiveToolCall(llmResponse, messages);
                }
            }
        }
    }

    public async getPrompt(name: string, args: {[key: string]: string}): Promise<any>{
        return await this.mcp.getPrompt({
           name: name,
           arguments: args
       })
    }

    onCloseForConnection = () =>{
        console.log('On close called for connection.');
        this.connect();
    }
}