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
import {ReactNode, useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {MCPClient} from "@/client/MCP_Client.ts";
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
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {getJobListing, JobDetails, jobDetailsToString} from "@/services/JobServices.ts";
import {FilePlus, HardDriveUpload, Search} from "lucide-react";
import {PdfUploadDialog} from "@/common-components/aam-file-uploader/PdfUploadDialog.tsx";
import {toast} from "sonner";
import {Label} from "@/components/ui/label.tsx";
import {ConfirmCreateResume} from "@/feature/workspace-page/confirm-create-resume-dialog/ConfirmCreateResume.tsx";
import pdfToText from "react-pdftotext";
import {setItem} from "@/utils/localStorage.ts";

const access_token_key = 'access_token';

const BASE_SERVER = import.meta.env.VITE_BASE_URL;

export const WorkspacePage = () => {
    const [searchParams] = useSearchParams();
    const [client, setClient] = useState<MCPClient | null>(null);
    const [role, setRole] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [datePosted, setDatePosted] = useState<string>('');
    const [jobs, setJobs] = useState<JobDetails[]>([]);
    const [uploadedResume, setUploadedResume] = useState<File|null>(null);
    const [isCreateResume, setIsCreateResume] = useState<boolean>(false);
    const init = async () => {
        const c = new MCPClient();
        await c.connectToServer(BASE_SERVER+"/mcp/connection");
        setClient(c);
    };


    const handleJobSearch = async () =>{
        console.log('Job search params:', role, ', location:', location, ', date posted:', datePosted);
        getJobListing(role, location, datePosted).then(
            response => {
                console.log('Response we got for jobs listing:', response);
                setJobs(response);
            }, error => {
                console.log('Error while fetching the data for jobs.', error);
            }
        )
    }

    const handleCreateResume = async () => {
        //Bring the job details for 3 jobs which don't for which we didn't created resume yet
        //Call job details api for each such job
        // Get first 3 jobs without resume
        if(jobs.length == 0){
            toast.error('No jobs are selected yet.');
            return;
        }
        if(!uploadedResume){
            toast.error('No reference resume is uploaded.');
            return;
        }

        const jobsToCreateResume = jobs
            .filter(job => !job.isResumeAvailable) // filter jobs without resume
            .slice(0, Math.min(1, jobs.length)); // take first 3

        console.log('Jobs we got for processing:', jobsToCreateResume);
        const resumeData = await pdfToText(uploadedResume);
        for(let i=0; i<jobsToCreateResume.length; i++){
            const response = await client?.getPrompt('create-resume', {
                "ReferenceResume": resumeData,
                "JobDetails": jobDetailsToString(jobsToCreateResume[i])
            })

            //console.log('Response for job:', jobsToCreateResume[i].jobTitle, ', response we got:', response);
            if (response) {
                const message = response.messages[0].content.text;
                console.log('Messages we got:', message);
                const finalMessage = await client?.processQuery(message);
                console.log('Final message we got:', finalMessage);
                if(finalMessage){
                    console.log('Data from final message:', finalMessage['docUrl'])
                    jobsToCreateResume[i].resumeUrl = finalMessage['docUrl'];
                }
            }
            //await client?.processQuery()
        }
    }
    useEffect(() => {
        const accessToken = searchParams.get("access_token");
        setItem(access_token_key, accessToken);
        init();
    }, []);


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
                                            <SelectItem value="anytime">Anytime</SelectItem>
                                            <SelectItem value="past 24 hours">Past 24 hours</SelectItem>
                                            <SelectItem value="past week">Past week</SelectItem>
                                            <SelectItem value="past month">Past month</SelectItem>
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
                        <div className={'w-[100%] h-[100vh]'}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job Id</TableHead>
                                        <TableHead>Job Title</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Link</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Resume URL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map(job => {
                                        return <TableRow>
                                            <TableCell>{job.jobId}</TableCell>
                                            <TableCell>{job.jobTitle}</TableCell>
                                            <TableCell>{job.companyName}</TableCell>
                                            <TableCell>{job.jobUrl ?  job.jobUrl.toString():'-'}</TableCell>
                                            <TableCell>{job.location}</TableCell>
                                            <TableCell>{job.resumeUrl ? job.resumeUrl: '-'}</TableCell>
                                        </TableRow> as ReactNode;
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
                <ConfirmCreateResume isOpen={isCreateResume}
                                     onClose={() => {
                                         setIsCreateResume(false)
                                     }}
                                     handleConfirmation={handleCreateResume}/>
            </SidebarInset>
        </SidebarProvider>
    )
}
