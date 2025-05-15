import {Transport} from '@modelcontextprotocol/sdk/shared/transport.d.ts';
import {JSONRPCMessageSchema, JSONRPCMessage} from '@modelcontextprotocol/sdk/types.js'
const SUBPROTOCOL = "mcp";

export class WebSocketClientTransport implements Transport {
    private readonly url: URL;
    private socket: WebSocket | null;

    private onclose: () => void = () => { console.log('On close was called.'); };
    private onerror: (error: Error) => void = (error) => { console.log('On error was called:', error); };
    private onmessage: (message: JSONRPCMessage) => void =  (message) => { console.log('On message was called:', message); };
    private bufferOnClose: () => void = () => { console.log('On close was called.'); };

    constructor(url: URL, onclose: ()=>void) {
        this.url = url;
        this.bufferOnClose = onclose;
        console.log('On call setup:', this.onclose);
        this.onclose();
    }

    public async start(){
        console.log('Starting the connection...')
        if(this.socket){
            throw new Error('Already connected the mcp server.');
        }
        this.socket = new WebSocket(this.url, SUBPROTOCOL);

        await new Promise<void>((resolve, reject) => {
            this.socket!.onopen = () => {
                console.log('WebSocket connection opened.');
                resolve();
            };
            // Optional: handle connection errors that occur before open
            this.socket!.onerror = (event) => {
                const error = "error" in event
                    ? event.error
                    : new Error(`WebSocket error: ${JSON.stringify(event)}`);
                this.onerror?.(error);
                reject(error);
            };
            this.socket!.onmessage = (event)=>{
                var _a, _b;
                let message;
                try{
                    message = JSONRPCMessageSchema.parse(JSON.parse(event.data));
                }catch (error){
                    (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
                    return;
                }
                (_b = this.onmessage) === null || _b === void 0 ? void 0 : _b.call(this, message);
            }
        });
        console.log('On close buffer:', this.bufferOnClose);
        this.onclose = this.bufferOnClose;
        console.log('On close contains:', this.onclose);
    }

    public async send(message: JSONRPCMessage){
        console.log('Sending message to the server!!!:', message);
        //Check for the connection
        //If connection is still on send the message
        //else throw error
        return new Promise((resolve, reject) => {
            var _a;
            if(!this.socket){
                reject(new Error("Not Connected"));
                return;
            }
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(message));
            resolve();
        })
    }

    public async close() {
        console.log('Closing connection with the server...');

        if (this.socket) {
            await new Promise<void>((resolve) => {
                this.socket!.onclose = () => {
                    resolve();
                };
                this.socket!.close();
            });
        } else {
            console.log('No existing connection to close.');
        }
        this.socket = null;
        this.onclose();
    }

}