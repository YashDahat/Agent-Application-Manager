import {Transport} from '@modelcontextprotocol/sdk/shared/transport.js'
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { WebSocket } from "ws";

export class WebsocketTransport implements Transport{
    webSocket: WebSocket | undefined = undefined;
    onmessage?: (message: JSONRPCMessage)=> void;
    constructor(webSocket: WebSocket) {
        this.webSocket = webSocket;
        this.webSocket.on("message", (data) => {
            try {
                const json = JSON.parse(data.toString());
                this.onmessage?.(json); // Trigger the callback if defined
            } catch (err) {
                console.error("Invalid JSON:", err);
            }
        })
    }

    async start(): Promise<void>{
        console.log('start connection requested!!!');
        if(!this.webSocket){
            throw new Error('Websocket is not registered');
        }
        console.log('Successfully connected to the server.');
        this.webSocket.send('Successfully connected to the server.');
    }

    async handlePostMessage(data: JSONRPCMessage){
        console.log('Got the data from the client.', data);
        // try {
        //     this.onmessage(data);
        // }catch (error){
        //     console.log('Error while sending the data!');
        // }
    }

    async send(message: JSONRPCMessage) {
        console.log('Sending back the data from server:', message);
        this.webSocket?.send(JSON.stringify(message))
    }

    async close(): Promise<void>{

    }
}