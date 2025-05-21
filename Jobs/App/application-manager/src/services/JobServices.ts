const baseURL = import.meta.env.VITE_BASE_URL

export interface JobDetails {
    jobId: string;
    jobTitle: string;
    jobDescription?: string;
    companyName: string;
    jobUrl: URL;
    skills?: string[];
    location: string;
    isResumeAvailable?: boolean;
    resumeUrl?: string;
}

export const getJobListing = async (role: string, location: string, datePosted: string): Promise<JobDetails[]>=> {
    const url = baseURL + '/get_jobs';
    console.log('URL for searching jobs:', url);
    const options: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            role: role,
            location: location,
            date_posted: datePosted
        }),
    };
    const response = await fetch(url, options);
    return await response.json() as JobDetails[];
}

export const getJobDetails = async (id: string) => {
    const url = baseURL + '/get_job_details?jobId=' + id;
    const options = {
        method: 'GET'
    }
    const response = await fetch(url, options);
    return await response.json() as JobDetails;
}

export function jobDetailsToString(details: JobDetails): string {
    return `
Job Title: ${details.jobTitle}
Company: ${details.companyName}
Location: ${details.location}
Job URL: ${details.jobUrl.toString()}
Job ID: ${details.jobId}
${details.jobDescription ? `Description: ${details.jobDescription}` : ''}
${details.skills ? `Skills: ${details.skills.join(', ')}` : ''}
${details.isResumeAvailable !== undefined ? `Resume Available: ${details.isResumeAvailable}` : ''}
  `.trim();
}