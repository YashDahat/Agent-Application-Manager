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
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Input} from "@/components/ui/input.tsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getJobListing, JobDetails} from "@/services/JobServices.ts";
import {FilePlus, FilePlus2, HardDriveUpload, Loader2, Search, Send} from "lucide-react";
import {PdfUploadDialog} from "@/common-components/aam-file-uploader/PdfUploadDialog.tsx";
import {toast} from "sonner";
import {Label} from "@/components/ui/label.tsx";
import {ConfirmCreateResume} from "@/feature/workspace-page/confirm-create-resume-dialog/ConfirmCreateResume.tsx";
import { setItem } from "@/utils/localStorage.ts";
import {AgGrid} from "@/common-components/aam-ag-grid/AgGrid.tsx";
import {IActionProps, IColumnProps, ITableProps} from "@/common-components/aam-ag-grid/table-props/TableProps.ts";
import {ReferralCreatingDialog} from "@/feature/workspace-page/referral-creating-dialog/ReferralCreatingDialog.tsx";

export const access_token_key = 'access_token';

export const WorkspacePage = () => {
    const [searchParams] = useSearchParams();
    const [role, setRole] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [datePosted, setDatePosted] = useState<string>('');
    const [jobs, setJobs] = useState<JobDetails[]>([]);
    const [selectedJobs, setSelectedJobs] = useState<JobDetails[]>([]);
    const [uploadedResume, setUploadedResume] = useState<File|null>(null);
    const [isCreateResume, setIsCreateResume] = useState<boolean>(false);
    const [isCreateReferral, setIsCreateReferral] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const columns: IColumnProps[] = [
        {key: 'jobId', label: 'Id'},
        {key: 'jobTitle', label: 'Title'},
        {key: 'companyName', label: 'Company'},
        {key: 'location', label: 'Location'},
        {key: 'jobUrl', label: 'Job Link', selectedCellEventHandler: (data)=>{
            const jobDetails = data as JobDetails;
            window.open(jobDetails.jobUrl);
        }},
        {key: 'resumeUrl', label: 'Resume Link', selectedCellEventHandler: (data)=>{
            const jobDetails = data as JobDetails;
            if(!jobDetails.resumeUrl || jobDetails.resumeUrl == ''){
                toast.error('Resume has not been created yet.');
                return;
            }
            window.open(new URL(jobDetails.resumeUrl));
        }}
    ]

    const actions: IActionProps[] = [
        {
            name: 'Build Resume',
            icon: <FilePlus2/>,
            actionEventHandler: async (data) => {
                if(!uploadedResume){
                    toast.error('Resume has not been uploaded yet.');
                    return;
                }
                const jobDetails = data as JobDetails;
                const updateJobs = jobs.filter((job) => job.jobId == jobDetails.jobId);
                setSelectedJobs(updateJobs);
                setIsCreateResume(true);
                setIsLoading(true);
            },
            design: 'ghost'
        },
        {
            name: 'Referral Message',
            icon: <Send/>,
            actionEventHandler: async (data) => {
                if(!uploadedResume){
                    toast.error('Resume has not been uploaded yet.');
                    return;
                }
                const jobDetails = data as JobDetails;
                const updateJobs = jobs.filter((job) => job.jobId == jobDetails.jobId);
                setSelectedJobs(updateJobs);
                setIsCreateReferral(true);
            },
            design: 'ghost'
        }
    ]


    const handleJobSearch = async () =>{
        console.log('Job search params:', role, ', location:', location, ', date posted:', datePosted);
        setIsLoading(true);
        getJobListing(role, location, datePosted).then(
            response => {
                console.log('Response we got for jobs listing:', response);
                setJobs(response);
                setIsLoading(false);
            }, error => {
                console.log('Error while fetching the data for jobs.', error);
                setIsLoading(false);
            }
        )
    }

    useEffect(() => {
        const accessToken = searchParams.get("access_token");
        setItem(access_token_key, accessToken);
    }, []);

    const tableProps: ITableProps = {
        columns: columns,
        items: jobs,
        isActionsEnabled: true,
        actions: actions
    }

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
                        <div className={'flex flex-row gap-2 p-2'}>
                            <div>
                                <Input type="text" id="role" placeholder="Role" value={role} onChange={(event) => {
                                    setRole(event.target.value);
                                }}/>
                            </div>
                            <div>
                                <Input type="text" id="location" placeholder="location" value={location} onChange={(event) => {
                                    setLocation(event.target.value);
                                }}/>
                            </div>
                            <div>
                                <Select onValueChange={(value)=> {console.log('Value changed:', value); setDatePosted(value);}}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select a date posted" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Date Posted</SelectLabel>
                                            <SelectItem value="anyTime">Anytime</SelectItem>
                                            <SelectItem value="past24Hours">Past 24 hours</SelectItem>
                                            <SelectItem value="pastWeek">Past week</SelectItem>
                                            <SelectItem value="pastMonth">Past month</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant={'outline'} onClick={handleJobSearch}><Search />Search</Button>
                            <Button variant={'outline'} onClick={()=>{
                                setIsCreateResume(true);
                            }}> <FilePlus />Create Resume</Button>
                            <PdfUploadDialog name={'Upload Resume'}
                                             onSave={(file) => {
                                                 console.log('File uploaded:', file);
                                                 setUploadedResume(file);
                                             }}
                                             icon=<HardDriveUpload/>/>
                            <Label>
                                {uploadedResume ? uploadedResume.name : ''}
                            </Label>
                        </div>
                        <div className={'w-[100%] h-[80vh]'}>
                            {isLoading? <div className="flex items-center justify-center h-screen">
                                    <Loader2 className="animate-spin"/>
                                </div>
                                : <AgGrid {...tableProps}/>}
                        </div>
                    </div>
                </div>
                <ConfirmCreateResume isOpen={isCreateResume}
                                    onClose={() => {
                                        setIsCreateResume(false)
                                        setIsLoading(false);
                                    }}
                                    referenceResume={uploadedResume!}
                                    jobs={selectedJobs}/>
                <ReferralCreatingDialog isOpen={isCreateReferral} 
                                        onClose={()=>{setIsCreateReferral(false)}}
                                        referenceResume={uploadedResume!}
                                        job={selectedJobs[0]}
                                        />
            </SidebarInset>
        </SidebarProvider>
    )
}
