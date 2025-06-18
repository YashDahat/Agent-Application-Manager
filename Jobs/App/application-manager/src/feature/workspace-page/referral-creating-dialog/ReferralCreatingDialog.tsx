import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import { Loader2 } from "lucide-react";
import { getJobDetails, JobDetails, jobDetailsToString } from "@/services/JobServices";
import { getItem } from "@/utils/localStorage";
import { access_token_key } from "../WorkspacePage";
import { useEffect, useState } from "react";
import { getReferralMessage } from "@/services/llmServices";
import pdfToText from "react-pdftotext";
import { toast } from "sonner";

export interface IReferralCreatingProp {
    isOpen: boolean;
    onClose: ()=>void;
    referenceResume: File;
    job?: JobDetails;
}
export const ReferralCreatingDialog = (props: IReferralCreatingProp) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const {job, referenceResume} = props;
    const handleMessageCreation = async () => {
        if(props.isOpen && job){
            const access_token = getItem(access_token_key);
            setIsLoading(true);
            const updatedJobDetails = await getJobDetails(job.jobId);
            const updatedJobDetailsString = jobDetailsToString(updatedJobDetails);
            const resumeData = await pdfToText(referenceResume);
            console.log('Creating referral message.');
            getReferralMessage(resumeData, updatedJobDetailsString, access_token).then(
                response => {
                    console.log('Created Message:', response);
                    setMessage(response.message as string);
                    setIsLoading(false);
                }, error => {
                    console.log('Error while creating message:', error);
                    toast.error('There was an issue while creating referral message.');
                    setIsLoading(false);
                }
            )
        }
    }

    useEffect(()=>{
        handleMessageCreation();
    },[job, props.isOpen]);

    return <Dialog open={props.isOpen} onOpenChange={()=>{props.onClose()}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Referral for Job</DialogTitle>
            </DialogHeader>
            <div className={'flex flex-row w-full h-[40vh]'}>
                <div className={'flex flex-col h-full w-full gap-1'}>
                    <Label>Message</Label>
                    {isLoading ? <div className="flex items-center justify-center h-screen">
                        <Loader2 className="animate-spin"/>
                    </div>: <Textarea className={'h-full'} rows={1000} value={message}></Textarea>}
                </div>
            </div>
            <DialogFooter>
                <Button onClick={props.onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}