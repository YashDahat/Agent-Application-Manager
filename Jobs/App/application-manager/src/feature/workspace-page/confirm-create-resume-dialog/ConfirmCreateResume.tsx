import {DialogBox} from "@/common-components/aam-dialog-box/DialogBox.tsx";

export interface IConfirmCreateResumeProps{
    isOpen: boolean,
    onClose: ()=>void,
    handleConfirmation: ()=>void,
}
export const ConfirmCreateResume = (props: IConfirmCreateResumeProps) =>{

    return <DialogBox isOpen={props.isOpen}
                      title={'Create Resume'}
                      description={'Are you sure you want to create resume. The files generated by LLM are not accurate. Please revisit them after creation.'}
                      confirmText={'Confirm'}
                      cancelText={'cancel'}
                      onConfirm={()=>{console.log('Confirmation received the create resume.'); props.handleConfirmation(); props.onClose()}}
                      onClose={props.onClose}/>
}