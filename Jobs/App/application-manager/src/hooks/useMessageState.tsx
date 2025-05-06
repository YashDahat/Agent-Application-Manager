import {useState} from "react";

export interface IMessage{
    fallBack: string;
    variant: 'sent'|'received';
    message: string;
    isLoading?: boolean
}

export function useMessageState<IMessage>(initialState: IMessage[]){
    const [messages, setMessages] = useState<IMessage[]>(initialState);

    function setMessagesForDisplay(message: IMessage){
        setMessages((prevState) => {
            if(message.message !== ''){
                const filteredMessages = prevState.filter((message) => !message.isLoading  )
                return [...filteredMessages, message];
            }
            return prevState;
        })
    }

    return [messages, setMessagesForDisplay];
}