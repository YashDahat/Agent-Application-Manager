import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import { Loader2 } from "lucide-react";

export interface IReferralCreatingProp {
    message: string;
    isOpen: boolean;
    onClose: ()=>void;
    isLoading?: boolean;
}
export const ReferralCreatingDialog = (props: IReferralCreatingProp) => {
    return <Dialog open={props.isOpen} onOpenChange={()=>{props.onClose()}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Referral for Job</DialogTitle>
            </DialogHeader>
            <div className={'flex flex-row w-full h-[40vh]'}>
                {/*<div className={'flex flex-col w-1/2'}>*/}
                {/*    <Label>Contact Sections</Label>*/}
                {/*</div>*/}
                <div className={'flex flex-col h-full w-full gap-1'}>
                    <Label>Message</Label>
                    {props.isLoading ? <div className="flex items-center justify-center h-screen">
                        <Loader2 className="animate-spin"/>
                    </div>: <Textarea className={'h-full'} rows={1000} value={props.message}></Textarea>}
                </div>
            </div>
            <DialogFooter>
                <Button onClick={props.onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}