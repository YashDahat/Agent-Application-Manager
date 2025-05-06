const baseURL = import.meta.env.VITE_BASE_URL

export interface JobDetails {
    jobId: string;
    jobTitle: string;
    jobDescription?: string;
    companyName: string;
    jobUrl: URL;
    skills?: string[];
    location: string;
}

export const getJobListing = async (role: string, location: string, datePosted: string): Promise<JobDetails[]>=> {
    const url = baseURL + 'get_jobs';
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