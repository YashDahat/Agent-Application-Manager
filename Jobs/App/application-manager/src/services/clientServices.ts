import {MCPClient} from "@/client/MCP_Client.ts";

const SSE_URL = import.meta.env.VITE_SSE_URL;
const client = new MCPClient()
export async function startConnection(): Promise<any>{
    return await client.connectToServer(SSE_URL)
}

export function getAllTools(){
    return client.tools;
}