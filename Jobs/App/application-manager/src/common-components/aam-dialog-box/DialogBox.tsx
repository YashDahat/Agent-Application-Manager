import React from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IDialogBoxProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: ()=>void;
}

export function DialogBox(props: IDialogBoxProps) {

    const handleConfirm = () => {
        props.onConfirm();
        props.onClose();
    };

    const handleCancel = () => {
        props.onClose();
    };

    return (
        <Dialog open={props.isOpen} onOpenChange={(open) => {if(!open){ console.log('on open changed!:', open); props.onClose() }}}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                    {props.description && <DialogDescription>{props.description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        {props.cancelText}
                    </Button>
                    <Button onClick={handleConfirm}>{props.confirmText}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
