import {AppSidebar} from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {Separator} from "@/components/ui/separator"
import {SidebarInset, SidebarProvider, SidebarTrigger,} from "@/components/ui/sidebar"
import {ChatInput} from "@/components/ui/chat/chat-input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {CornerDownLeft, Mic, Paperclip} from "lucide-react";
import {ChatMessageList} from "@/components/ui/chat/chat-message-list.tsx";
import {ChatBubble, ChatBubbleAvatar, ChatBubbleMessage} from "@/components/ui/chat/chat-bubble.tsx";
import {ReactNode, useEffect, useState} from "react";
import {usePersistedState} from "@/hooks/usePersistedState.tsx";
import {data, useSearchParams} from "react-router-dom";
import {MCPClient} from "@/client/MCP_Client.ts";
import {IMessage, useMessageState} from "@/hooks/useMessageState.tsx";

const access_token = 'access_token';
const refresh_token  = 'refresh_token';
const SSE_URL = import.meta.env.VITE_SSE_URL;




export const WorkspacePage = () => {
    const [searchParams] = useSearchParams();
    const [accessToken, setAccessToken] = usePersistedState(access_token, '');
    const [refreshToken, setRefreshToken] = usePersistedState(refresh_token, '');
    const [client, setClient] = useState<MCPClient | null>(null);
    const [messages, setMessages] = useMessageState([]);
    const [userMessage, setUserMessage] = useState<string>('');
    const init = async () => {
        const c = new MCPClient();
        await c.connectToServer("http://localhost:3000/mcp/connection");
        setClient(c);
    };

    async function processQuery(){
        const message: IMessage = {
            variant: 'sent',
            fallBack: 'US',
            message: String(userMessage)
        }
        const aiLoadingMessage: IMessage = {
            variant: 'received',
            fallBack: 'AI',
            message: '',
            isLoading: true
        }
        setMessages(message);
        setMessages(aiLoadingMessage);
        setUserMessage('');
        client?.processQuery(message.message, setMessages).then(
            response => {
                console.log('Response from LLM:', response);
                setMessages(prevState => {
                    let updatedState = prevState.slice(0, prevState.length - 1);
                    updatedState.push({
                        fallBack: 'AI',
                        variant: 'received',
                        message: response
                    });
                    return updatedState;
                })
            }, error => {
                console.log('Error while implementing response:', error);
            }
        )
    }


    useEffect(() => {
        const accessToken = searchParams.get("access_token");
        console.log('Access Token:', accessToken);
        setAccessToken(accessToken);
        init();
    }, []);

    useEffect(() => {
        console.log('Messages we are got!!!:', messages);
    }, [messages]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Building Your Application
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-row gap-4 p-2 pt-0">
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                        {/*<iframe*/}
                        {/*    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRs8L_miqoOYEAh7chQ7o9UhLuMb-z1nv3gEF8n-HFLdI-tyxi4JvPhXt69aGzljt_5BD1u_vBy_UOo/pubhtml?gid=0&single=true"*/}
                        {/*    width="100%"*/}
                        {/*    height="100%"*/}
                        {/*    frameBorder="0"*/}
                        {/*    title="Google Spreadsheet"*/}
                        {/*></iframe>*/}
                    </div>
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                        <div className="flex flex-col h-full gap-2 p-4">
                            {/* Chat messages area (80%) */}
                            <div className="flex-grow-[8] overflow-y-auto">
                                <ChatMessageList className="flex flex-col gap-2 pr-2">
                                    {messages.map((message, index) => {
                                        return <ChatBubble key={index} variant={message.variant}>
                                            <ChatBubbleAvatar fallback={message.fallBack}/>
                                            <ChatBubbleMessage variant={message.variant} isLoading={message.isLoading}>
                                                {message.message}
                                            </ChatBubbleMessage>
                                        </ChatBubble> as ReactNode
                                    })}
                                </ChatMessageList>
                            </div>

                            {/* Input area (20%) anchored at the bottom */}
                            <div className="flex-grow-[2] flex flex-col justify-end">
                                <div
                                    className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1">
                                    <ChatInput
                                        placeholder="Type your message here..."
                                        className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
                                        value={userMessage}
                                        onChange={(event) => {
                                            setUserMessage(event.target.value);
                                        }}
                                    />
                                    <div className="flex items-center p-3 pt-0">
                                        <Button variant="ghost" size="icon">
                                            <Paperclip className="size-4"/>
                                            <span className="sr-only">Attach file</span>
                                        </Button>

                                        <Button variant="ghost" size="icon">
                                            <Mic className="size-4"/>
                                            <span className="sr-only">Use Microphone</span>
                                        </Button>

                                        <Button size="sm" className="ml-auto gap-1.5" onClick={processQuery}>
                                            Send Message
                                            <CornerDownLeft className="size-3.5"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
