import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import * as http from "http";
import {WebSocket, WebSocketServer} from "ws";
import {WebsocketTransport} from "./transport/Websocket.js";
import Routes from "./routes/Routes.js"
import {MCPServerHandler} from "./mcp/MCPServerHandler.js";

dotenv.config();

console.log('Client URL:', process.env.CLIENT_URL);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
app.use(express.json());
app.use(cors({origin: process.env.CLIENT_URL}));
app.use(Routes);
let websocketTransport: WebsocketTransport | null = null;

const mcpServerHandler = new MCPServerHandler();


//Websocket connection
wss.on('connection', (ws: WebSocket, request: Request) => {
    console.log('Client is connected to server!');
    console.log('Request received from the server:', request);
    websocketTransport = new WebsocketTransport(ws);
    mcpServerHandler.getMcpServer().connect(websocketTransport);
})


server.listen(3000, () => {
    console.log('Server listening on localhost: 3000');
});