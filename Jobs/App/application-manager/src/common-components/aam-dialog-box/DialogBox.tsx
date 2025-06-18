import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import React from "react";
import { Loader2 } from "lucide-react";

interface IDialogBoxProps {
    isOpen: boolean;
    title: string;
    isLoading?: boolean;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: ()=>void;
}

export function DialogBox(props: IDialogBoxProps) {

    const handleConfirm = () => {
        props.onConfirm();
    };

    const handleCancel = () => {
        props.onClose();
    };

    return (
        <Dialog open={props.isOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                    {props.description ? <DialogDescription>{props.description}</DialogDescription> as React.ReactElement
                        : <></>}
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        {props.cancelText}
                    </Button>
                    <Button onClick={handleConfirm}>{props.confirmText}</Button>
                    { props.isLoading ? <Loader2  className="animate-spin"/>:<></> }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
